"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { Wallet, Edit2, Loader2, ShieldCheck } from "lucide-react";

export interface OrderSummaryItem {
  label: string;
  value: React.ReactNode;
}

export interface ReviewAndPayProps {
  /** Service title shown at top of the summary */
  title: string;
  /** Resolved summary rows (label/value pairs). Build these in ServiceFlow before passing. */
  items: OrderSummaryItem[];
  /** The total amount to charge */
  amount: number;
  /** Wallet balance */
  balance: number;
  /** Available payment gateways */
  gateways: any[];
  /** Currently selected gateway id */
  selectedGatewayId: number | null;
  /** Callback when user picks a gateway */
  onSelectGateway: (id: number) => void;
  /** Callback when user taps "Edit" to go back to step 1 */
  onEdit: () => void;
  /** Callback when user confirms payment */
  onPay: () => void;
  /** Whether the payment is currently being processed */
  submitting: boolean;
  /** Optional live status message (modal opening, verifying, polling) */
  paymentStatusLabel?: string | null;
}

export function ReviewAndPay({
  title,
  items,
  amount,
  balance,
  gateways,
  selectedGatewayId,
  onSelectGateway,
  onEdit,
  onPay,
  submitting,
  paymentStatusLabel,
}: ReviewAndPayProps) {
  const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);
  const isWallet = selectedGateway?.slug === "wallet";
  const insufficientBalance = isWallet && amount > balance;

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {/* Order Summary */}
      <div className="rounded-2xl border bg-muted/30 p-5 text-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">Order Summary</h3>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary ring-1 ring-border transition hover:bg-primary/5"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
        </div>

        <div className="space-y-3">
          <SummaryRow label="Service" value={<span className="font-semibold">{title}</span>} />
          {items.map((item, i) => (
            <SummaryRow key={i} label={item.label} value={item.value} />
          ))}
        </div>

        <div className="mt-4 border-t pt-4 space-y-2">
          <SummaryRow label="Subtotal" value={formatNaira(amount)} />
          <SummaryRow label="Fee" value={formatNaira(0)} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
          <span className="text-sm font-semibold text-muted-foreground">Total</span>
          <span className="text-xl font-black tracking-tight text-primary">{formatNaira(amount)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <h3 className="text-base font-bold">Payment Method</h3>
        <div className="space-y-2">
          {gateways.map((gateway: any) => {
            const selected = selectedGatewayId === gateway.id;
            const gwIsWallet = gateway.slug === "wallet";
            const lowBalance = gwIsWallet && amount > balance;

            return (
              <button
                key={gateway.id}
                onClick={() => onSelectGateway(gateway.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      gwIsWallet ? "bg-primary/10 text-primary" : "bg-secondary"
                    }`}
                  >
                    {gwIsWallet ? (
                      <Wallet className="h-5 w-5" />
                    ) : gateway.logo_url ? (
                      <img src={gateway.logo_url} alt={gateway.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{gateway.name}</p>
                    {gwIsWallet && (
                      <p className={`text-xs ${lowBalance ? "text-destructive" : "text-muted-foreground"}`}>
                        Balance: {formatNaira(balance)}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pay Button */}
      <div className="pt-2">
        <Button
          className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
          size="lg"
          onClick={onPay}
          disabled={submitting || !selectedGatewayId || insufficientBalance}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            `Pay ${formatNaira(amount)}`
          )}
        </Button>
        {insufficientBalance && (
          <p className="mt-2 text-center text-xs text-destructive font-medium">
            Insufficient wallet balance. Fund your wallet or select another method.
          </p>
        )}
        {paymentStatusLabel && (
          <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse font-medium">
            {paymentStatusLabel}
          </p>
        )}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
