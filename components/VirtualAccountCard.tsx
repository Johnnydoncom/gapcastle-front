"use client";
import { useState } from "react";
import { Check, Copy, Landmark, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useVirtualAccount } from "@/hooks/useGapcastle";

/**
 * The customer's own bank account for funding their wallet. Money sent here
 * reaches the wallet automatically, with nothing to confirm in the app.
 */
export function VirtualAccountCard() {
  const { data: account, isLoading, isError } = useVirtualAccount();
  const [copied, setCopied] = useState(false);

  const copyAccountNumber = async () => {
    if (!account?.account_number) return;
    try {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy the number manually.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your account details...
      </div>
    );
  }

  if (isError || !account?.enabled) return null;

  if (account.status !== "ready" || !account.account_number) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Setting up your account number
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          This usually takes a moment. It will appear here when it is ready.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-white">
          <Landmark className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold leading-tight">Fund your wallet</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Transfer to this account from any bank app</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account number</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p className="text-3xl font-bold tabular-nums tracking-wider text-primary sm:text-4xl">
            {account.account_number}
          </p>
          <Button size="sm" className="w-full gap-1.5 sm:w-auto" onClick={copyAccountNumber} aria-live="polite">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Bank</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold">{account.bank_name}</dd>
        </div>
        {account.account_name && (
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Account name</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">{account.account_name}</dd>
          </div>
        )}
      </dl>

      <p className="mt-4 flex items-center gap-1.5 border-t pt-4 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
        Your wallet updates automatically after each transfer.
      </p>
    </section>
  );
}
