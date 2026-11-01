"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Check, ChevronsUpDown, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionPinDialog } from "@/components/TransactionPinDialog";
import { useKycStatus, useProfile, useWallet } from "@/hooks/useGapcastle";
import { formatNaira } from "@/lib/format";
import { TransactionPinError, assertPinAccepted } from "@/lib/transaction-pin";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
const OWN_ACCOUNT_ONLY = "You can only transfer to an account in your own name.";

/** Why a transfer cannot start, in place of the form. */
function TransferGate({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4 py-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
      {action}
    </div>
  );
}

export default function TransferPage() {
  const { data: wallet } = useWallet();
  // Only BVN-verified users may transfer out; the API enforces it as well.
  const { data: kyc } = useKycStatus();
  // Transfers pause after a name change; the API enforces it as well.
  const { data: profile } = useProfile();
  const holdUntil: string | null = profile?.withdrawal_hold_until ?? null;
  const qc = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  /** Identifies this visit's transfer, so a retry after a dropped connection cannot send it twice. */
  const idempotencyKey = useRef(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  /** Why a transfer cannot proceed, when the bank list could not be loaded. */
  const [unavailable, setUnavailable] = useState<string | null>(null);
  /** Set when the resolved account is not in the user's own name. */
  const [accountMismatch, setAccountMismatch] = useState<string | null>(null);
  /** The gateway's flat fee bands, returned alongside the bank list. */
  const [feeTiers, setFeeTiers] = useState<{ up_to: number | null; fee: number }[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [fetchingBanks, setFetchingBanks] = useState(true);
  const [bankComboboxOpen, setBankComboboxOpen] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [validatingAccount, setValidatingAccount] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("new");

  /*
   * Transfers cost a flat fee by amount band (each band covers amounts up to
   * and including up_to; the last is open). Mirrors
   * PaymentGateway::withdrawalFeeFor() — the API's figure is what is charged.
   */
  const feeFor = (value: number) => {
    if (!value || value <= 0 || feeTiers.length === 0) return 0;
    const tier = feeTiers.find((t) => t.up_to === null || value <= Number(t.up_to))
      ?? feeTiers[feeTiers.length - 1];
    return Number(tier.fee) || 0;
  };
  const fee = feeFor(amount);
  const balance = Number(wallet?.balance ?? 0);
  const exceedsBalance = wallet !== undefined && amount > 0 && amount + fee > balance;

  const fetchBanks = async () => {
    setFetchingBanks(true);
    try {
      const res = await fetch(`${API_URL}/wallet/banks`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      const data = await res.json();
      // Array-guarded: anything else reaching setBanks would throw on .map and
      // take the whole page down rather than degrade.
      if (res.ok && Array.isArray(data?.data)) {
        setBanks(data.data);
        setFeeTiers(Array.isArray(data?.fee_tiers) ? data.fee_tiers : []);
        setUnavailable(null);
        return;
      }
      // Refused when no active gateway is configured for transfers. Without
      // this the page just showed a disabled bank picker and no reason.
      setBanks([]);
      setUnavailable(data?.message || "Transfers are currently unavailable. Please try again later.");
    } catch (error) {
      console.error("Failed to fetch banks", error);
      setUnavailable("Could not load the bank list. Please check your connection and try again.");
    } finally {
      setFetchingBanks(false);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/beneficiaries`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      const data = await res.json();
      // Guarded for the same reason as the bank list: a non-array here would
      // crash the saved accounts tab on .map.
      setBeneficiaries(res.ok && Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      setBeneficiaries([]);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBanks();
    fetchBeneficiaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const validateAccount = async () => {
        setValidatingAccount(true);
        try {
          const res = await fetch(`${API_URL}/wallet/validate-account`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setAccountName(data.data.account_name);
            // Transfers may only reach an account in the user's own name. The
            // API enforces that, but reporting it here means the mismatch is
            // visible as soon as the account resolves rather than after the
            // Transfer button is pressed.
            setAccountMismatch(data.data.belongs_to_user === false ? OWN_ACCOUNT_ONLY : null);
          } else {
            setAccountName("");
            setAccountMismatch(null);
            toast.error(data.message || "Invalid account details");
          }
        } catch {
          setAccountName("");
          setAccountMismatch(null);
        } finally {
          setValidatingAccount(false);
        }
      };
      validateAccount();
    } else {
      setAccountName("");
      setAccountMismatch(null);
    }
  }, [accountNumber, bankCode, token]);

  /**
   * Without a PIN this validates the form and opens the PIN dialog, which
   * calls back with one. A PIN refusal is rethrown for the dialog to show.
   */
  const submitTransfer = async (pin?: string) => {
    if (amount < 100) return toast.error("Minimum transfer is ₦100");
    if (!bankCode) return toast.error("Please select a bank");
    if (!accountNumber || accountNumber.length < 10) return toast.error("Please enter a valid account number");
    if (!accountName) return toast.error("Please ensure your account is validated first");
    // Belt and braces alongside the disabled button; the API enforces this too.
    if (accountMismatch) return toast.error(accountMismatch);

    if (!pin) {
      setPinOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ amount, account_number: accountNumber, bank_code: bankCode, transaction_pin: pin, idempotency_key: idempotencyKey.current }),
      });
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      assertPinAccepted(data);
      if (!res.ok) throw new Error(data.message || "Failed to start your transfer");

      toast.success("Your transfer is on its way");

      if (saveBeneficiary) {
        await fetch(`${API_URL}/wallet/beneficiaries`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            account_number: accountNumber,
            bank_code: bankCode,
            bank_name: banks.find((b) => b.code === bankCode)?.name || "Unknown Bank",
            account_name: accountName,
          }),
        });
      }

      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      router.push("/account/wallet");
    } catch (error: any) {
      if (error instanceof TransactionPinError) throw error;
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="new">New account</TabsTrigger>
        <TabsTrigger value="saved">Saved accounts</TabsTrigger>
      </TabsList>

      <TabsContent value="saved">
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {beneficiaries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No saved accounts yet.</p>
          ) : (
            beneficiaries.map((ben) => (
              <button
                type="button"
                key={ben.id}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                onClick={() => {
                  setBankCode(ben.bank_code);
                  setAccountNumber(ben.account_number);
                  setAccountName(ben.account_name);
                  setActiveTab("new");
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {ben.account_name.substring(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{ben.account_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{ben.bank_name} · {ben.account_number}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="new">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bank</Label>
            <Popover open={bankComboboxOpen} onOpenChange={setBankComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={bankComboboxOpen} className="w-full justify-between font-normal disabled:opacity-50" disabled={fetchingBanks || banks.length === 0}>
                  {fetchingBanks ? "Loading banks..." : bankCode ? banks.find((bank) => bank.code === bankCode)?.name : "Select a bank"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search bank..." />
                  <CommandList>
                    <CommandEmpty>No bank found.</CommandEmpty>
                    <CommandGroup>
                      {banks.map((bank) => (
                        <CommandItem key={bank.code} value={bank.name} onSelect={() => { setBankCode(bank.code); setBankComboboxOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", bankCode === bank.code ? "opacity-100" : "opacity-0")} />
                          {bank.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {!fetchingBanks && unavailable && (
              <p className="rounded border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">{unavailable}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ""));
                if (e.target.value.length < 10) setAccountName("");
              }}
              placeholder="0123456789"
            />
            {validatingAccount && (
              <p className="flex items-center text-xs text-primary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Verifying account...</p>
            )}
            {!validatingAccount && accountName && (
              accountMismatch ? (
                <div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
                  <div className="flex items-center font-medium">
                    <AlertCircle className="mr-2 h-4 w-4 shrink-0" /> {accountName}
                  </div>
                  {/* No "Save" option: an account that can never be transferred
                      to is not worth keeping. */}
                  <p className="mt-1 text-xs">{accountMismatch}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded bg-primary/5 p-2 text-sm text-primary">
                  <div className="flex min-w-0 items-center"><Check className="mr-2 h-4 w-4 shrink-0" /><span className="truncate">{accountName}</span></div>
                  {!beneficiaries.find((b) => b.account_number === accountNumber && b.bank_code === bankCode) && (
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={saveBeneficiary} onChange={(e) => setSaveBeneficiary(e.target.checked)} className="rounded border-primary/50 text-primary focus:ring-primary" />
                      <Save className="h-3 w-3" /> Save
                    </label>
                  )}
                </div>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input type="number" min={100} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" />
            {exceedsBalance && (
              <p className="text-xs text-destructive">That is more than your balance, including the {formatNaira(fee)} fee.</p>
            )}
          </div>

          {/* A transfer deducts the amount plus the fee, so show both rather
              than leaving the difference to be discovered. */}
          {amount > 0 && (
            <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>You receive</span><span>{formatNaira(amount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Transfer fee</span><span>{formatNaira(fee)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Deducted from wallet</span><span>{formatNaira(amount + fee)}</span></div>
            </div>
          )}

          <Button className="w-full" onClick={() => submitTransfer()} disabled={loading || amount <= 0 || exceedsBalance || !bankCode || accountNumber.length !== 10 || !accountName || !!accountMismatch}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Processing..." : `Transfer ${amount ? formatNaira(amount) : ""}`}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/account/wallet" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Wallet
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Transfer</h1>
            <p className="text-sm text-muted-foreground">Send money from your wallet to your bank account.</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold">{formatNaira(balance)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        {!kyc ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : kyc.enabled && kyc.status !== "verified" ? (
          <TransferGate
            title="Verify your identity to transfer"
            action={(
              <Button asChild className="w-full">
                <Link href="/account/settings#identity">{kyc.status === "pending" ? "Finish verification" : "Verify my BVN"}</Link>
              </Button>
            )}
          >
            {kyc.status === "pending"
              ? "Your BVN verification is waiting for your approval on the NIBSS page."
              : "For your security, only BVN-verified accounts can transfer. It takes about a minute."}
          </TransferGate>
        ) : holdUntil ? (
          <TransferGate title="Transfers are paused">
            For your security, transfers are paused after a name change. You can transfer again from {new Date(holdUntil).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.
          </TransferGate>
        ) : form}
      </div>

      <TransactionPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Confirm transfer"
        description={`${formatNaira(amount + fee)} will leave your wallet: ${formatNaira(amount)} to ${accountName}, plus a ${formatNaira(fee)} transfer fee.`}
        onConfirm={(pin) => submitTransfer(pin)}
      />
    </div>
  );
}
