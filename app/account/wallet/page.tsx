"use client";
import { useState, useEffect, useRef } from "react";
import { useWallet, useTransactions } from "@/hooks/useGapcastle";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira, formatDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, Gift, History, Loader2, Plus, Receipt, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { openGatewayModal } from "@/lib/gateway-sdk";
import { VirtualAccountCard } from "@/components/VirtualAccountCard";
import { cn } from "@/lib/utils";

/** One quick action on the wallet card: a labelled circle on phones, a pill from sm up. */
const walletAction = "group flex flex-col items-center gap-1.5 rounded-2xl py-1 text-xs font-medium text-white/90 transition-transform active:scale-95 sm:flex-row sm:gap-2 sm:bg-white/10 sm:px-3.5 sm:py-2 sm:text-sm sm:transition-colors sm:hover:bg-white/15";
const walletActionIcon = "flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/20 sm:h-6 sm:w-6 sm:bg-transparent sm:group-hover:bg-transparent";

function activityMeta(t: any): { Icon: React.ElementType; tint: string; credit: boolean } {
  if (t.type === "wallet_funding") return { Icon: ArrowDownLeft, tint: "bg-success/10 text-success", credit: true };
  if (t.type === "cashback") return { Icon: Gift, tint: "bg-success/10 text-success", credit: true };
  if (t.type === "refund") return { Icon: RotateCcw, tint: "bg-amber-500/10 text-amber-600", credit: true };
  if (t.type === "wallet_withdrawal") return { Icon: ArrowUpRight, tint: "bg-destructive/10 text-destructive", credit: false };
  return { Icon: Receipt, tint: "bg-primary/10 text-primary", credit: false };
}

const statusLabel = (status: string) => (status === "pending_payment" ? "Pending" : status);

const statusTint = (status: string) => {
  if (status === "successful") return "text-muted-foreground";
  if (status === "failed") return "text-destructive";
  return "text-amber-600";
};

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions(20);
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const [fundOpen, setFundOpen] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  
  const [amount, setAmount] = useState(0);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [loading, setLoading] = useState(false);

  // Funding state
  const [fundingGateways, setFundingGateways] = useState<any[]>([]);
  const [selectedGatewaySlug, setSelectedGatewaySlug] = useState("");
  const [fetchingGateways, setFetchingGateways] = useState(false);

  /*
   * charge_fee is a percentage of the amount, so the fee only exists once an
   * amount is entered. Mirrors PaymentGateway::feeFor() on the API, which
   * remains the figure actually charged — this is a preview.
   */
  const feeFor = (amount: number, percentage: number | string | undefined) => {
    const pct = Number(percentage) || 0;
    if (pct <= 0 || !amount || amount <= 0) return 0;
    return Math.round(amount * pct * 100) / 10000;
  };

  const fundingFeePct = Number(
    fundingGateways.find((g: any) => g.slug === selectedGatewaySlug)?.charge_fee ?? 0
  );
  const fundingFee = feeFor(amount, fundingFeePct);

  // Blocks a second top-up starting before the first has re-rendered the button.
  const fundingRef = useRef(false);

  /*
   * A bank transfer has no redirect or modal to report back, so while the
   * customer is looking at their account details, watch for the deposit.
   */
  useEffect(() => {
    if (!fundOpen) return;
    const timer = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    }, 10_000);
    return () => clearInterval(timer);
  }, [fundOpen, qc]);

  const balanceWhenOpened = useRef<number | null>(null);
  useEffect(() => {
    if (!fundOpen) {
      balanceWhenOpened.current = null;
      return;
    }
    const balance = wallet?.balance === undefined ? null : Number(wallet.balance);
    if (balance === null) return;
    if (balanceWhenOpened.current === null) {
      balanceWhenOpened.current = balance;
    } else if (balance > balanceWhenOpened.current) {
      toast.success(`${formatNaira(balance - balanceWhenOpened.current)} added to your wallet`);
      balanceWhenOpened.current = balance;
    }
  }, [fundOpen, wallet?.balance]);

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
    if (fundingRef.current) return;
    fundingRef.current = true;
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
        // What the gateway's checkout charges: the amount plus any gateway
        // charges (Flutterwave), from the server. Never displayed in the app.
        amount: Number(txnData.checkout_amount ?? txnData.total ?? amount),
        email: userEmail,
        name: (session?.user as any)?.name ?? undefined,
        phone: (session?.user as any)?.phone ?? undefined,
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

      // Verify payment with the backend. ALATPay returns its own transaction id
      // (gatewayReference) which the backend needs to confirm the charge.
      const gatewayReference = gatewayResult.status === "success" ? gatewayResult.gatewayReference : undefined;
      const verifyRes = await fetch(`${API_URL}/wallet/verify-payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference: txnData.reference, gateway_reference: gatewayReference }),
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
      fundingRef.current = false;
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

  return (
    <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">Fund, transfer, and track your money.</p>
      </div>

      <section className="relative overflow-hidden rounded-3xl gradient-wallet p-4 text-white shadow-elegant sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-indigo-400/10" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3 px-1">
            <button
              type="button"
              onClick={() => setBalanceHidden(!balanceHidden)}
              aria-label={balanceHidden ? "Show balance" : "Hide balance"}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white"
            >
              Available balance
              {balanceHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <Link href="/account/rewards" className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/15">
              Cashback {balanceHidden ? "₦••••" : formatNaira(wallet?.cashback_balance ?? 0)}
            </Link>
          </div>

          <p className="mt-2 truncate px-1 text-[2rem] font-bold leading-tight tracking-tight tabular-nums sm:text-4xl">
            {balanceHidden ? "₦••••••" : formatNaira(wallet?.balance ?? 0)}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:flex sm:gap-2.5">
            <button type="button" onClick={handleOpenFund} className={walletAction}>
              <span className={cn(walletActionIcon, "bg-white text-slate-900 group-hover:bg-white/90 sm:bg-white sm:group-hover:bg-white/90")}><Plus className="h-5 w-5 sm:h-4 sm:w-4" /></span>
              Add Fund
            </button>
            <Link href="/account/wallet/transfer" className={walletAction}>
              <span className={walletActionIcon}><Send className="h-5 w-5 sm:h-4 sm:w-4" /></span>
              Transfer
            </Link>
            <Link href="/account/transactions" className={walletAction}>
              <span className={walletActionIcon}><History className="h-5 w-5 sm:h-4 sm:w-4" /></span>
              History
            </Link>
          </div>

          <div className="mt-4 sm:mt-5">
            <VirtualAccountCard tone="dark" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-card sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link href="/account/transactions" className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {!txns?.length ? (
          <div className="py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <History className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {txns.map((t: any) => {
              const { Icon, tint, credit } = activityMeta(t);
              return (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tint)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.provider_name || t.type.replace("_", " ")}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(t.created_at)}<span className="hidden sm:inline"> · {t.reference}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-sm font-semibold tabular-nums", credit && "text-success")}>
                      {credit ? "+" : "-"}{formatNaira(t.amount)}
                    </p>
                    {/* What the customer sent differs from what arrived, so say why. */}
                    {t.type === "wallet_funding" && Number(t.fee) > 0 ? (
                      <p className="text-xs text-muted-foreground"><span className="hidden sm:inline">Sent {formatNaira(t.total)}, fee</span><span className="sm:hidden">Fee</span> {formatNaira(t.fee)}</p>
                    ) : (
                      <p className={cn("text-xs capitalize", statusTint(t.status))}>{statusLabel(t.status)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="max-h-[90dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DialogHeader><DialogTitle>Fund wallet</DialogTitle></DialogHeader>
          <VirtualAccountCard />

          {/* Only gateways other than Flutterwave come back from the API, for
              customers who would rather not make a transfer. */}
          {fundingGateways.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Or pay another way</p>
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
                              <p className="text-[10px] text-muted-foreground mt-1">Fee: {Number(gw.charge_fee)}%</p>
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

            {/* The fee is a percentage of the amount, so it only becomes real
                once both an amount and a gateway are chosen. Gateways that
                charge on their own checkout (Flutterwave) report no fee. */}
            {amount > 0 && selectedGatewaySlug && fundingFeePct > 0 && (
              <div className="mt-3 space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount</span><span>{formatNaira(amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing fee{fundingFeePct > 0 ? ` (${fundingFeePct}%)` : ""}</span>
                  <span>{formatNaira(fundingFee)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>You pay</span><span>{formatNaira(amount + fundingFee)}</span>
                </div>
              </div>
            )}

            <Button className="w-full mt-4" onClick={fundWallet} disabled={loading || amount < 100 || (!selectedGatewaySlug && fundingGateways.length > 0)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Redirecting to payment..." : `Fund ${amount ? formatNaira(amount) : "wallet"}`}
            </Button>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
