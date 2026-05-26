"use client";
import { useState } from "react";
import { useWallet, useProfile, useTransactions } from "@/hooks/useGapcastle";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira, formatDate } from "@/lib/format";
import { Gift, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Rewards() {
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const cashbackTxns = txns.filter((t: any) => Number(t.cashback) > 0 || t.type === "cashback");

  const withdraw = async () => {
    if (amount <= 0) return toast.error("Enter an amount");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/withdraw-cashback`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to withdraw cashback");
      
      toast.success(`${formatNaira(amount)} moved to your wallet`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setAmount(0);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(profile?.referral_code ?? "GAP123");
    toast.success("Referral code copied!");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards & Cashback</h1>
        <p className="text-sm text-muted-foreground">Earn back on every transaction.</p>
      </div>

      <div className="rounded-2xl gradient-success p-6 text-success-foreground shadow-elegant">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90"><Gift className="h-4 w-4" />Cashback balance</div>
        <p className="mt-2 text-4xl font-bold">{formatNaira(wallet?.cashback_balance ?? 0)}</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Withdraw to wallet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Move your cashback into your main wallet to spend.</p>
        <div className="mt-4 flex gap-2">
          <Input type="number" min={1} max={Number(wallet?.cashback_balance ?? 0)} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
          <Button onClick={withdraw} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Withdraw</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Refer & earn</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share your code. Earn ₦500 when a friend completes their first payment.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-accent p-4">
          <Label className="flex-1 font-mono text-lg font-bold text-primary">{profile?.referral_code ?? "GAP123"}</Label>
          <Button size="sm" variant="outline" onClick={copyRef}><Copy className="mr-1 h-3 w-3" />Copy</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-semibold">Cashback history</h2>
        {cashbackTxns.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Make a payment to start earning cashback.</p>
        ) : (
          <div className="divide-y">
            {cashbackTxns.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{t.description || t.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                </div>
                <p className="font-semibold text-success">+{formatNaira(t.cashback || t.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
