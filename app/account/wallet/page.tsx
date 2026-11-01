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
import { Plus, ArrowDownToLine, Loader2, Landmark, Send } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { openGatewayModal } from "@/lib/gateway-sdk";
import { VirtualAccountCard } from "@/components/VirtualAccountCard";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions(20);
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const [fundOpen, setFundOpen] = useState(false);
  
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
          <Button asChild variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Link href="/account/wallet/transfer"><Send className="h-4 w-4" />Transfer</Link>
          </Button>
        </div>
      </div>

      <VirtualAccountCard />

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
                  {/* What the customer sent differs from what arrived, so say why. */}
                  {t.type === "wallet_funding" && Number(t.fee) > 0 && (
                    <p className="text-xs text-muted-foreground">Sent {formatNaira(t.total)}, fee {formatNaira(t.fee)}</p>
                  )}
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
