"use client";
import Link from "next/link";
import { useWallet, useProfile, useTransactions, useServices } from "@/hooks/useGapcastle";
import { formatNaira, formatDate } from "@/lib/format";
import { getServiceUi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import {
  Plus, Eye, EyeOff, ArrowUpRight, CircleDollarSign,
  CheckCircle2, Clock, XCircle, RefreshCw, Wallet, Gift,
  ArrowDownLeft,
} from "lucide-react";
import { useState } from "react";

/** Derive colour + icon from transaction type / status */
function getTxnMeta(t: any): {
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
  label: string;
  isCredit: boolean;
} {
  const type: string = t.type ?? "bill_payment";

  if (type === "wallet_funding") {
    return { iconBg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400", Icon: Wallet, label: "Wallet Top-up", isCredit: true };
  }
  if (type === "cashback") {
    return { iconBg: "bg-emerald-100 dark:bg-emerald-900/40", iconColor: "text-emerald-600 dark:text-emerald-400", Icon: Gift, label: "Cashback", isCredit: true };
  }
  if (type === "refund") {
    return { iconBg: "bg-amber-100 dark:bg-amber-900/40", iconColor: "text-amber-600 dark:text-amber-400", Icon: RefreshCw, label: "Refund", isCredit: true };
  }

  // Bill payment — derive service icon from service_group slug
  const serviceGroup: string = t.service_group ?? "";
  const ui = getServiceUi(serviceGroup);
  const LucideIcon = ((Icons as any)[ui?.icon ?? "CircleDollarSign"] ?? CircleDollarSign) as React.ElementType;
  return {
    iconBg: ui?.color ?? "bg-primary/10",
    iconColor: "text-primary",
    Icon: LucideIcon,
    label: t.description || t.provider_name || "Bill Payment",
    isCredit: false,
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "successful") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-2.5 w-2.5" /> Success
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
        <XCircle className="h-2.5 w-2.5" /> Failed
      </span>
    );
  }
  if (status === "pending" || status === "pending_payment" || status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
        <Clock className="h-2.5 w-2.5" /> Pending
      </span>
    );
  }
  return null;
}

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
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your account today.</p>
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
        {/* display only on desktop devices and remove on mobile devices */}
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
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Recent transactions</h2>
          <Link href="/account/transactions" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>

        {!txns?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ArrowDownLeft className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground">Pay your first bill to get started!</p>
            <Link href="/account/services">
              <Button size="sm" className="mt-1 gap-2 rounded-full px-5">
                <Plus className="h-4 w-4" /> Pay a bill
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {txns.map((t: any) => {
              const { iconBg, iconColor, Icon, label, isCredit } = getTxnMeta(t);
              const status: string = t.status ?? "";
              const hasCashback = Number(t.cashback) > 0 && status === "successful";

              return (
                <li key={t.id}>
                  <Link
                    href="/account/transactions"
                    className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-muted/40 active:bg-muted/60 sm:gap-4"
                  >
                    {/* Service icon */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>

                    {/* Middle: description + date + status */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug text-foreground">
                        {label}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatDate(t.created_at)}</span>
                        <StatusBadge status={status} />
                      </div>
                      {hasCashback && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Gift className="h-2.5 w-2.5" />
                          +{formatNaira(t.cashback)} cashback
                        </span>
                      )}
                    </div>

                    {/* Right: amount */}
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold tabular-nums ${
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : status === "failed"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                      }`}>
                        {isCredit ? "+" : "−"}{formatNaira(t.amount)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
