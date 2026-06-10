"use client";
import Link from "next/link";
import { useWallet, useProfile, useTransactions, useServices } from "@/hooks/useGapcastle";
import { formatNaira, formatDate } from "@/lib/format";
import { getServiceUi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { Plus, Eye, EyeOff, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const { data: txns } = useTransactions(5);
  const { data: services, isLoading: servicesLoading } = useServices();
  const [hide, setHide] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi, {profile?.full_name?.split(" ")[0] || "there"} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your account today.</p>
      </div>

      {/* Wallet card */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl gradient-wallet p-6 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider opacity-80">Wallet balance</p>
            <button onClick={() => setHide(!hide)} className="opacity-70 hover:opacity-100">
              {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-4xl font-bold">{hide ? "₦••••••" : formatNaira(wallet?.balance ?? 0)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/account/wallet"><Button variant="secondary" className="gap-2"><Plus className="h-4 w-4" />Fund wallet</Button></Link>
            <Link href="/account/services"><Button variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">Pay a bill</Button></Link>
          </div>
        </div>
        {/* display only on desktopo devices and remove on mobile devices */}
        <div className="rounded-2xl border bg-card p-6 shadow-card hidden md:block">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Cashback earned</p>
          <p className="mt-2 text-3xl font-bold text-success">{formatNaira(wallet?.cashback_balance ?? 0)}</p>
          <Link href="/account/rewards" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View rewards <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Quick services */}
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Quick pay</h2>
          <Link href="/account/services" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {servicesLoading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-xl border p-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            ))
            : services?.map((s: { slug: string; name: string }) => {
              const ui = getServiceUi(s.slug);
              const Icon = ((Icons as any)[ui.icon] ?? CircleDollarSign) as React.ElementType;
              return (
                <Link key={s.slug} href={`/account/${ui.href}`} className="group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition hover:border-primary hover:bg-accent">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ui.color}`}><Icon className="h-5 w-5" /></div>
                  <span className="text-[11px] font-medium leading-tight">{s.name || ui.label}</span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent transactions</h2>
          <Link href="/account/transactions" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {!txns?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet. Pay your first bill!</p>
        ) : (
          <div className="divide-y">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{t.description || t.provider_name || t.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${t.type === "wallet_funding" || t.type === "cashback" ? "text-success" : ""}`}>
                    {t.type === "wallet_funding" || t.type === "cashback" ? "+" : "-"}{formatNaira(t.amount)}
                  </p>
                  {Number(t.cashback) > 0 && <p className="text-xs text-success">+{formatNaira(t.cashback)} cashback</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
