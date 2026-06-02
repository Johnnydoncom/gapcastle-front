"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get("reference");

  return (
    <div className="mx-auto max-w-md py-12 animate-in fade-in zoom-in duration-300">
      <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-destructive/10 to-transparent" />
        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20 text-destructive ring-8 ring-destructive/5 mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Payment Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your transaction could not be completed.</p>

          {reference && (
            <div className="bg-card mt-6 rounded-xl p-5 text-left text-sm border border-border shadow-sm">
              <div className="flex justify-between gap-4 py-1">
                <span className="text-muted-foreground">Reference</span>
                <span className="text-right text-foreground font-mono bg-muted px-2 py-1 rounded">
                  {reference}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="flex-1 font-semibold" onClick={() => router.push("/app/transactions")}>
              View History
            </Button>
            <Button className="flex-1 font-semibold" onClick={() => router.push("/app/services")}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
