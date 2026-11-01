"use client";
import { useState } from "react";
import { Check, Copy, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVirtualAccount } from "@/hooks/useGapcastle";
import { cn } from "@/lib/utils";

/**
 * The customer's own bank account for funding their wallet. Money sent here
 * reaches the wallet automatically.
 *
 * @param tone "dark" sits on the wallet card as a frosted panel; "light" is for
 * ordinary backgrounds such as the Add Fund sheet.
 */
export function VirtualAccountCard({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { data: account, isLoading, isError } = useVirtualAccount();
  const [copied, setCopied] = useState(false);
  const dark = tone === "dark";

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
  const muted = dark ? "text-white/65" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3 ring-1 ring-inset sm:p-3.5",
        dark ? "bg-white/10 ring-white/15 backdrop-blur-sm" : "bg-accent/60 ring-primary/10",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          dark ? "bg-white/15 text-white" : "bg-primary/10 text-primary",
        )}
      >
        {ready ? <Landmark className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
      </span>

      {ready ? (
        <>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-[11px] font-medium leading-none", muted)}>{account.bank_name}</p>
            <p className="mt-1.5 text-lg font-bold leading-none tabular-nums tracking-wide">{account.account_number}</p>
            {/* On its own line: it is what customers check before sending money. */}
            <p className={cn("mt-1.5 truncate text-xs leading-none", muted)}>{account.account_name}</p>
          </div>
          <button
            type="button"
            onClick={copyAccountNumber}
            aria-label={copied ? "Account number copied" : "Copy account number"}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-95",
              dark ? "bg-white text-slate-900 hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </>
      ) : (
        <p className={cn("text-sm", muted)}>
          {isLoading ? "Loading your account number..." : "Setting up your account number..."}
        </p>
      )}
    </div>
  );
}
