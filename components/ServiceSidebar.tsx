"use client";

import { useTransactions } from "@/hooks/useGapcastle";
import { formatNaira } from "@/lib/format";
import { History, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceSidebarProps {
  category: string;
  onAutofill: (identifier: string, amount?: number) => void;
}

export function ServiceSidebar({ category, onAutofill }: ServiceSidebarProps) {
  // Fetch recent transactions. The hook handles the limit and token internally if passed.
  const { data: allTransactions, isLoading } = useTransactions(15);
  
  // Filter transactions for this specific category and successful/pending ones
  const recentTxns = (allTransactions || [])
    .filter((t: any) => t.bill_service?.slug === category || t.service_group === category)
    .slice(0, 5); // limit to 5 recent for UI cleanliness

  return (
    <div className="hidden space-y-6 lg:block">
      {/* Promotional / Cashback Widget */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 p-6 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            <span className="font-bold text-yellow-300 text-sm tracking-wider uppercase">Cashback Active</span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold leading-tight">
            Earn up to 1.5% instant cashback
          </h3>
          <p className="mt-2 text-sm text-indigo-100 opacity-90">
            Every time you pay a bill or buy data, we drop instant cash directly into your wallet.
          </p>
        </div>
      </div>

      {/* Recent Transactions Contextual Panel */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 text-foreground">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Recent {category.charAt(0).toUpperCase() + category.slice(1)}</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50"></div>
            ))}
          </div>
        ) : recentTxns.length > 0 ? (
          <div className="space-y-3">
            {recentTxns.map((txn: any) => (
              <div key={txn.id} className="group relative flex items-center justify-between rounded-xl border border-transparent bg-secondary/30 p-3 transition-colors hover:border-primary/20 hover:bg-secondary/60">
                <div>
                  <p className="font-semibold text-sm">{txn.customer}</p>
                  <p className="text-xs text-muted-foreground">{txn.bill_provider?.name || "Provider"} • {formatNaira(txn.amount)}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full text-primary opacity-0 transition-opacity group-hover:opacity-100 bg-primary/10 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onAutofill(txn.customer, txn.amount)}
                  title="Repeat transaction"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <div className="mb-3 rounded-full bg-secondary p-3">
              <History className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">No recent transactions</p>
            <p className="text-xs opacity-70 mt-1">Your quick-repeats will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
