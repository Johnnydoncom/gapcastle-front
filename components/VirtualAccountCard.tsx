"use client";
import { useState } from "react";
import { Check, Copy, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVirtualAccount } from "@/hooks/useGapcastle";

/**
 * The customer's own bank account for funding their wallet, as one slim row.
 * Money sent here reaches the wallet automatically.
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

  if (isError || (!isLoading && !account?.enabled)) return null;

  const ready = account?.status === "ready" && !!account.account_number;

  return (
    <div className="@container rounded-xl border bg-card px-4 py-3 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {ready ? <Landmark className="h-[18px] w-[18px]" /> : <Loader2 className="h-[18px] w-[18px] animate-spin" />}
        </span>
  
        {ready ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-base font-semibold tabular-nums tracking-wide">{account.account_number}</span>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  aria-label={copied ? "Account number copied" : "Copy account number"}
                  title={copied ? "Copied" : "Copy"}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {[account.bank_name, account.account_name].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="hidden shrink-0 text-xs text-muted-foreground @xl:block">Transfer here to fund your wallet</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading your account number..." : "Setting up your account number..."}
          </p>
      )}
      </div>
    </div>
  );
}
