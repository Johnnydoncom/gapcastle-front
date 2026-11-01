"use client";
import { useState } from "react";
import { Check, Copy, Landmark, Loader2 } from "lucide-react";
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
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold leading-tight">Your account number</h2>
          <p className="text-xs text-muted-foreground">Transfer from any bank to fund your wallet</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-wider">{account.account_number}</p>
          <p className="truncate text-sm text-muted-foreground">{account.bank_name}</p>
          {account.account_name && <p className="truncate text-sm text-muted-foreground">{account.account_name}</p>}
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={copyAccountNumber}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Your wallet is credited automatically, usually within minutes. A small processing fee is taken from each
        transfer and shown in your transaction history.
      </p>
    </div>
  );
}
