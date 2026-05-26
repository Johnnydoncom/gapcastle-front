"use client";
import { useState } from "react";
import { useWallet, useTransactions } from "@/hooks/useGapcastle";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira, formatDate } from "@/lib/format";
import { Plus, ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions(20);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<"card" | "transfer" | "ussd">("card");
  const [loading, setLoading] = useState(false);

  const fundWallet = async () => {
    if (amount < 100) return toast.error("Minimum funding is ₦100");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/wallet/fund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ amount, method })
      });
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to fund wallet");
      toast.success(`Wallet funded with ${formatNaira(amount)}`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
      setAmount(0);
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
          <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Fund wallet</Button>
          <Button variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" disabled><ArrowDownToLine className="h-4 w-4" />Withdraw (soon)</Button>
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
                <div>
                  <p className="font-medium">{t.description || t.provider_name || t.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.created_at)} · {t.reference}</p>
                </div>
                <p className={`font-semibold ${t.type === "wallet_funding" || t.type === "cashback" ? "text-success" : ""}`}>
                  {t.type === "wallet_funding" || t.type === "cashback" ? "+" : "-"}{formatNaira(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fund wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="rounded-lg bg-accent p-3 text-xs text-accent-foreground">Demo mode — funding is simulated. No real charge will occur.</p>
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" min={100} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" />
              <div className="flex flex-wrap gap-2 pt-1">
                {[1000, 5000, 10000, 25000, 50000].map(a => (
                  <button key={a} type="button" onClick={() => setAmount(a)} className="rounded-full border px-3 py-1 text-xs hover:border-primary hover:bg-accent">₦{a.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["card","transfer","ussd"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-xl border p-3 text-sm font-medium capitalize ${method === m ? "border-primary bg-accent" : ""}`}>{m}</button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={fundWallet} disabled={loading || amount <= 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Funding…" : `Fund ${amount ? formatNaira(amount) : "wallet"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
