"use client";
import { useState } from "react";
import { useTransactions } from "@/hooks/useGapcastle";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira, formatDate } from "@/lib/format";
import { Search } from "lucide-react";

export default function Transactions() {
  const { data: txns = [] } = useTransactions();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const filtered = txns.filter(t => {
    if (type !== "all" && t.type !== type) return false;
    if (q && !`${t.description ?? ""} ${t.provider_name ?? ""} ${t.reference}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">All your payments in one place.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by reference, provider…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="bill_payment">Bill payments</SelectItem>
            <SelectItem value="wallet_funding">Wallet funding</SelectItem>
            <SelectItem value="cashback">Cashback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No transactions match your filters.</p>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-secondary/30">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.description || t.provider_name || t.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t.reference}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${t.type === "wallet_funding" || t.type === "cashback" ? "text-success" : ""}`}>
                    {t.type === "wallet_funding" || t.type === "cashback" ? "+" : "-"}{formatNaira(t.amount)}
                  </p>
                  {Number(t.cashback) > 0 && <p className="text-xs text-success">+{formatNaira(t.cashback)} back</p>}
                  <span className="text-[10px] uppercase text-muted-foreground">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
