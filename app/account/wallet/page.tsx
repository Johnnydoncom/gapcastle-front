"use client";
import { useState, useEffect } from "react";
import { useWallet, useTransactions } from "@/hooks/useGapcastle";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira, formatDate } from "@/lib/format";
import { Plus, ArrowDownToLine, Loader2, Landmark, Check, ChevronsUpDown, Save } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { openGatewayModal } from "@/lib/gateway-sdk";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions(20);
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  
  const [amount, setAmount] = useState(0);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [loading, setLoading] = useState(false);

  // Funding state
  const [fundingGateways, setFundingGateways] = useState<any[]>([]);
  const [selectedGatewaySlug, setSelectedGatewaySlug] = useState("");
  const [fetchingGateways, setFetchingGateways] = useState(false);

  // Withdrawal state
  const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [bankComboboxOpen, setBankComboboxOpen] = useState(false);
  
  // Beneficiary and validation states
  const [accountName, setAccountName] = useState("");
  const [validatingAccount, setValidatingAccount] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [activeWithdrawTab, setActiveWithdrawTab] = useState("new");

  useEffect(() => {
    const checkPayment = async () => {
      // Our internal reference is always embedded in the redirect URL by the backend.
      // Monnify appends `?paymentReference=xxx` instead of `&`, creating a malformed value
      // like `FND-xxx?paymentReference=FND-xxx`. We sanitize by splitting on `?`.
      const rawReference = searchParams?.get("reference")
        || searchParams?.get("tx_ref")
        || searchParams?.get("paymentReference")
        || searchParams?.get("trxref");
      const reference = rawReference?.split("?")[0] ?? null;

      const isFunded = searchParams?.get("funded") === "true";

      if (isFunded && reference) {
        if (!token) {
          // Session is still loading — wait for the next effect run when token is available.
          return;
        }

        setFetchingGateways(true);
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
          const res = await fetch(`${API_URL}/wallet/verify-payment`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reference }),
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data?.message || "Payment is still processing or verification failed.");
          } else {
            toast.success("Wallet funded successfully!");
            qc.invalidateQueries({ queryKey: ["wallet"] });
            qc.invalidateQueries({ queryKey: ["transactions"] });
          }
        } catch (error: any) {
          toast.error("Could not verify payment. Please refresh.");
        } finally {
          setFetchingGateways(false);
          window.history.replaceState({}, "", "/account/wallet");
        }
      } else if (searchParams?.get("funded") === "error") {
        toast.error("Payment failed or was cancelled.");
        window.history.replaceState({}, "", "/account/wallet");
      }
    };

    checkPayment();
  }, [searchParams, qc, token]);

  const fundWallet = async () => {
    if (amount < 100) return toast.error("Minimum funding is ₦100");
    setLoading(true);
    try {
      if (!token) throw new Error("Authentication token not found.");
      const selectedGateway = fundingGateways.find(g => g.slug === selectedGatewaySlug);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/fund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          amount, 
          gateway_slug: selectedGatewaySlug || undefined,
          redirect_url: typeof window !== 'undefined' ? `${window.location.origin}/account/wallet?funded=true` : undefined
        })
      });
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to initiate funding");
      
      const txnData = data.data;
      if (!txnData?.payment_url && !txnData?.access_code && !txnData?.reference) {
        throw new Error("Failed to retrieve payment details");
      }

      if (!selectedGateway) {
        if (txnData?.payment_url) {
          window.location.href = txnData.payment_url;
          return; // Navigating away
        } else {
          throw new Error("Failed to retrieve payment link");
        }
      }

      const userEmail = (session?.user as any)?.email ?? `user-${txnData.reference}@gapcastle.ng`;

      const gatewayResult = await openGatewayModal({
        gatewaySlug: selectedGateway.slug,
        reference: txnData.reference,
        accessCode: txnData.access_code ?? "",
        paymentUrl: txnData.payment_url ?? null,
        amount: Number(txnData.total ?? amount),
        email: userEmail,
        name: (session?.user as any)?.name ?? undefined,
        publicKey: selectedGateway.public_key ?? "",
        sdkConfig: selectedGateway.sdk_config ?? {},
        currency: "NGN",
      });

      if (gatewayResult.status === "cancelled") {
        toast.info("Payment cancelled.");
        return;
      }

      if (gatewayResult.status === "error") {
        throw new Error(gatewayResult.message);
      }

      // Verify payment with the backend
      const verifyRes = await fetch(`${API_URL}/wallet/verify-payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference: txnData.reference }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toast.error(verifyData?.message || "Payment verification failed.");
      } else {
        toast.success("Wallet funded successfully!");
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        setFundOpen(false);
        setAmount(0);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    setFetchingBanks(true);
    try {
      if (!token) throw new Error("Authentication token not found.");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/banks`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setBanks(data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch banks", error);
      toast.error("Failed to load banks");
    } finally {
      setFetchingBanks(false);
    }
  };

  const fetchFundingGateways = async () => {
    setFetchingGateways(true);
    try {
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/funding-gateways`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setFundingGateways(data.data);
        if (data.data.length > 0 && !selectedGatewaySlug) {
          setSelectedGatewaySlug(data.data[0].slug);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch funding gateways", error);
    } finally {
      setFetchingGateways(false);
    }
  };

  const handleOpenFund = () => {
    setFundOpen(true);
    if (fundingGateways.length === 0) {
      fetchFundingGateways();
    }
  };

  const handleOpenWithdraw = () => {
    setWithdrawOpen(true);
    if (banks.length === 0) {
      fetchBanks();
    }
    if (beneficiaries.length === 0) {
      fetchBeneficiaries();
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const validateAccount = async () => {
        setValidatingAccount(true);
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
          const res = await fetch(`${API_URL}/wallet/validate-account`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setAccountName(data.data.account_name);
          } else {
            setAccountName("");
            toast.error(data.message || "Invalid account details");
          }
        } catch (error) {
          setAccountName("");
        } finally {
          setValidatingAccount(false);
        }
      };
      validateAccount();
    } else {
      setAccountName("");
    }
  }, [accountNumber, bankCode, token]);

  const fetchBeneficiaries = async () => {
    try {
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/beneficiaries`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setBeneficiaries(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const withdrawWallet = async () => {
    if (amount < 100) return toast.error("Minimum withdrawal is ₦100");
    if (!bankCode) return toast.error("Please select a bank");
    if (!accountNumber || accountNumber.length < 10) return toast.error("Please enter a valid account number");
    if (!accountName) return toast.error("Please ensure your account is validated first");

    setLoading(true);
    try {
      if (!token) throw new Error("Authentication token not found.");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ amount, account_number: accountNumber, bank_code: bankCode })
      });
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to initiate withdrawal");
      
      toast.success(data.message || "Withdrawal initiated successfully");
      
      if (saveBeneficiary) {
        await fetch(`${API_URL}/wallet/beneficiaries`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            account_number: accountNumber,
            bank_code: bankCode,
            bank_name: banks.find(b => b.code === bankCode)?.name || "Unknown Bank",
            account_name: accountName
          })
        });
        fetchBeneficiaries();
      }

      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setWithdrawOpen(false);
      setAmount(0);
      setAccountNumber("");
      setBankCode("");
      setAccountName("");
      setSaveBeneficiary(false);
      setActiveWithdrawTab("new");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">Fund, transfer, and track your money.</p>
      </div>

      <div className="rounded-2xl gradient-wallet p-6 text-white shadow-elegant">
        <p className="text-xs uppercase tracking-wider opacity-80">Available balance</p>
        <p className="mt-2 text-4xl font-bold">{formatNaira(wallet?.balance ?? 0)}</p>
        <p className="mt-1 text-sm opacity-80">Cashback: {formatNaira(wallet?.cashback_balance ?? 0)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleOpenFund} className="flex-1 sm:flex-none">
              <Plus className="mr-2 h-4 w-4" /> Add Fund
            </Button>
          <Button variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={handleOpenWithdraw}><ArrowDownToLine className="h-4 w-4" />Withdraw</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-semibold">Recent activity</h2>
        {!txns?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="divide-y">
            {txns.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.type === 'wallet_funding' ? 'bg-success/10 text-success' : t.type === 'wallet_withdrawal' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {t.type === 'wallet_funding' ? <Plus className="h-5 w-5" /> : t.type === 'wallet_withdrawal' ? <ArrowDownToLine className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{t.description || t.provider_name || t.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.created_at)} · {t.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${t.type === "wallet_funding" || t.type === "cashback" ? "text-success" : t.type === 'wallet_withdrawal' ? "text-destructive" : ""}`}>
                    {t.type === "wallet_funding" || t.type === "cashback" ? "+" : "-"}{formatNaira(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fund wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" min={100} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" />
              <div className="flex flex-wrap gap-2 pt-1">
                {[1000, 5000, 10000, 25000, 50000].map(a => (
                  <button key={a} type="button" onClick={() => setAmount(a)} className="rounded-full border px-3 py-1 text-xs hover:border-primary hover:bg-accent">₦{a.toLocaleString()}</button>
                ))}
              </div>
            </div>

            {fundingGateways.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label>Payment Method</Label>
                {fetchingGateways ? (
                  <p className="text-xs text-muted-foreground animate-pulse">Loading payment methods...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {fundingGateways.map((gw) => (
                      <label 
                        key={gw.id} 
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 shadow-sm transition-all hover:bg-accent ${selectedGatewaySlug === gw.slug ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-1">
                            {gw.logo_url ? (
                              <img src={gw.logo_url} alt={gw.name} className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                {gw.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-none">{gw.name}</p>
                            {gw.charge_fee > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-1">Fee: ₦{gw.charge_fee}</p>
                            )}
                          </div>
                        </div>
                        <input 
                          type="radio" 
                          name="payment_gateway" 
                          value={gw.slug} 
                          checked={selectedGatewaySlug === gw.slug}
                          onChange={(e) => setSelectedGatewaySlug(e.target.value)}
                          className="h-4 w-4 shrink-0 text-primary focus:ring-primary border-slate-300"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button className="w-full mt-4" onClick={fundWallet} disabled={loading || amount < 100 || (!selectedGatewaySlug && fundingGateways.length > 0)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Redirecting to payment..." : `Fund ${amount ? formatNaira(amount) : "wallet"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
          <Tabs value={activeWithdrawTab} onValueChange={setActiveWithdrawTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="new">New Account</TabsTrigger>
              <TabsTrigger value="saved">Beneficiaries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="saved" className="space-y-4">
              <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto pr-2">
                {beneficiaries.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No saved beneficiaries found.
                  </div>
                ) : (
                  beneficiaries.map((ben) => (
                    <div 
                      key={ben.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                      onClick={() => {
                        setBankCode(ben.bank_code);
                        setAccountNumber(ben.account_number);
                        setAccountName(ben.account_name);
                        setActiveWithdrawTab("new");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {ben.account_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm leading-tight">{ben.account_name}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{ben.bank_name} • {ben.account_number}</span>
                        </div>
                      </div>
                    </div>
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
                      <Button variant="outline" role="combobox" aria-expanded={bankComboboxOpen} className="w-full justify-between disabled:opacity-50" disabled={fetchingBanks || banks.length === 0}>
                        {bankCode ? banks.find(bank => bank.code === bankCode)?.name : "Select a bank"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {banks.map(bank => (
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
                  {fetchingBanks && <p className="text-xs text-muted-foreground animate-pulse">Loading banks...</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input type="text" maxLength={10} value={accountNumber} onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                    if (e.target.value.length < 10) setAccountName("");
                  }} placeholder="0123456789" />
                  {validatingAccount && <p className="text-xs text-primary animate-pulse flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Verifying account...</p>}
                  {!validatingAccount && accountName && (
                    <div className="rounded border bg-primary/5 p-2 text-sm text-primary flex items-center justify-between">
                      <div className="flex items-center"><Check className="h-4 w-4 mr-2" /> {accountName}</div>
                      {!beneficiaries.find(b => b.account_number === accountNumber && b.bank_code === bankCode) && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs ml-2">
                          <input type="checkbox" checked={saveBeneficiary} onChange={(e) => setSaveBeneficiary(e.target.checked)} className="rounded border-primary/50 text-primary focus:ring-primary" />
                          <span className="flex items-center"><Save className="h-3 w-3 mr-1" /> Save</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input type="number" min={100} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" />
                </div>

                <Button className="w-full mt-2" onClick={withdrawWallet} disabled={loading || amount <= 0 || !bankCode || !accountNumber || accountNumber.length !== 10 || !accountName}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Processing..." : `Withdraw ${amount ? formatNaira(amount) : ""}`}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
