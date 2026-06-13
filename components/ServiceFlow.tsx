"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet, useProviders, usePaymentGateways } from "@/hooks/useGapcastle";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { serviceRegistry } from "@/lib/services/registry";
import { DynamicFormFields } from "@/components/DynamicFormFields";
import { ReviewAndPay, type OrderSummaryItem } from "@/components/ReviewAndPay";
import { openGatewayModal } from "@/lib/gateway-sdk";

export interface ServiceFlowProps {
  category: string;
  title?: string;
  initialProviders?: any[];
  initialWallet?: any;
  [key: string]: any; // To allow legacy props without TS errors
}

export function ServiceFlow({ category, title: overrideTitle, initialProviders, initialWallet }: ServiceFlowProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const { data: wallet } = useWallet(initialWallet);

  const config = serviceRegistry[category];
  const groupSlug = config?.slug || category;

  const { data: providers = [] } = useProviders(groupSlug, initialProviders);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: config ? zodResolver(config.schema) : undefined,
    defaultValues: config?.defaultValues || {},
  });

  const providerId = watch("providerId");
  const amount = watch("amount");
  const identifier = watch("identifier");
  const planName = watch("planName");

  const products = providers.find((p: any) => p.id === providerId)?.products || [];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [resultTxn, setResultTxn] = useState<any>(null);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [formValues, setFormValues] = useState<any>(null);
  /** Human-readable status shown below the Pay button while the modal / poll is active */
  const [paymentStatusLabel, setPaymentStatusLabel] = useState<string | null>(null);
  /** Live status of the transaction on the receipt screen: processing | successful | failed */
  const [txnStatus, setTxnStatus] = useState<"processing" | "successful" | "failed">("processing");
  const [txnErrorMessage, setTxnErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-select first provider by default
  useEffect(() => {
    if (providers.length > 0 && !providerId) {
      setValue("providerId", providers[0].id);
    }
  }, [providers, providerId, setValue]);

  const { data: gateways = [] } = usePaymentGateways();
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null);

  // Auto-select wallet if available
  useEffect(() => {
    if (gateways.length > 0 && !selectedGatewayId) {
      const walletGateway = gateways.find((g: any) => g.slug === 'wallet');
      if (walletGateway) setSelectedGatewayId(walletGateway.id);
      else setSelectedGatewayId(gateways[0].id);
    }
  }, [gateways, selectedGatewayId]);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!config) {
    return <div className="p-8 text-center text-destructive font-semibold">Service configuration not found for: {category}</div>;
  }

  const balance = Number(wallet?.balance ?? 0);
  const title = overrideTitle || config.title;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

  const onReview = (data: any) => {
    setFormValues(data);
    setStep(2);
  };

  /**
   * Poll GET /transactions/{reference}/status until the transaction leaves the
   * processing state, then update UI accordingly.
   */
  const pollTransactionStatus = (reference: string, token: string, txnSnapshot: any) => {
    let attempts = 0;
    let consecutiveErrors = 0;
    const MAX_ATTEMPTS = 36; // 3 minutes at 5-second intervals
    const MAX_ERRORS = 3;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/transactions/${reference}/status`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_ERRORS) {
            clearInterval(pollRef.current!);
            // Don't mark failed — we simply stop polling. Receipt stays in processing state
            // with a note that the user should check history.
          }
          return;
        }

        consecutiveErrors = 0;
        const data = await res.json();
        const status = (data?.data?.status ?? "") as string;
        const errorMessage = (data?.data?.error_message ?? "") as string;
        const latestData = data?.data ?? {};

        if (status === "successful") {
          clearInterval(pollRef.current!);
          // Merge the fresh server data into resultTxn so the receipt shows token/details
          setResultTxn((prev: any) => ({ ...prev, ...txnSnapshot, ...latestData, status }));
          setTxnStatus("successful");
          qc.invalidateQueries({ queryKey: ["wallet"] });
          qc.invalidateQueries({ queryKey: ["transactions"] });
        } else if (status === "failed") {
          clearInterval(pollRef.current!);
          setTxnStatus("failed");
          setTxnErrorMessage(errorMessage || "Your payment could not be processed.");
          qc.invalidateQueries({ queryKey: ["wallet"] });
          qc.invalidateQueries({ queryKey: ["transactions"] });
        }
        // pending_payment / processing → keep polling silently
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_ERRORS) {
          clearInterval(pollRef.current!);
        }
      }
    }, 5000);
  };

  const handlePay = async () => {
    const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);
    if (selectedGateway?.slug === 'wallet' && Number(formValues.amount) > balance) {
      return toast.error("Insufficient wallet balance. Fund your wallet or select another payment method.");
    }

    setSubmitting(true);
    setPaymentStatusLabel(null);
    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Session expired. Please log in again.");

      // ── Step 1: create the transaction on the backend ──────────────────────
      const payload: any = {
        bill_service_slug: groupSlug,
        bill_provider_id: formValues.providerId,
        bill_product_id: formValues.planId || null,
        customer: formValues.identifier,
        amount: Number(formValues.amount),
        metadata: { ...formValues },
        payment_gateway_id: selectedGateway?.slug === 'wallet' ? null : selectedGatewayId,
      };

      const res = await fetch(`${API_URL}/transactions/purchase`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired.");
      }
      if (!res.ok) throw new Error(result.message || "Payment failed");

      // ── Step 2a: wallet pay — done immediately ─────────────────────────────
      if (!result.data?.payment_url && !result.data?.access_code) {
        setResultTxn(result.data || result);
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        setStep(3);
        return;
      }

      // ── Step 2b: gateway pay — open inline modal ───────────────────────────
      const txnData = result.data;
      const { payment_url, access_code, reference } = txnData;

      setPaymentStatusLabel("Opening payment modal…");

      // Use the user profile email from session; fall back to identifier if it looks like an email
      const userEmail =
        (session?.user as any)?.email ??
        (formValues.identifier?.includes("@") ? formValues.identifier : `user-${reference}@gapcastle.ng`);

      const gatewayResult = await openGatewayModal({
        gatewaySlug: selectedGateway!.slug,
        reference,
        accessCode: access_code ?? "",
        paymentUrl: payment_url ?? null,
        amount: Number(formValues.amount),
        email: userEmail,
        name: (session?.user as any)?.name ?? undefined,
        publicKey: selectedGateway!.public_key ?? "",
        sdkConfig: selectedGateway!.sdk_config ?? {},
        currency: "NGN",
      });

      // ── Step 3: handle modal result ────────────────────────────────────────
      if (gatewayResult.status === "cancelled") {
        // The user dismissed the modal; the backend transaction stays as pending_payment.
        // Webhook will eventually process it if the gateway actually captured the payment.
        setSubmitting(false);
        setPaymentStatusLabel(null);
        toast.info("Payment cancelled. Your order has not been processed.");
        return;
      }

      if (gatewayResult.status === "error") {
        throw new Error(gatewayResult.message);
      }

      // ── Step 4: verify payment with backend ───────────────────────────────
      setPaymentStatusLabel("Verifying payment…");
      const verifyRes = await fetch(`${API_URL}/transactions/verify`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ reference }),
      });
      const verifyData = await verifyRes.json();
      const verifiedStatus = verifyData?.data?.status ?? "";

      // ── Step 5: show receipt immediately, poll in background ─────────────
      // Whether the bill is already delivered or still queuing, we show the
      // receipt screen right away so the user is never blocked.
      setResultTxn({ ...txnData, ...verifyData?.data });
      setTxnStatus(verifiedStatus === "successful" ? "successful" : "processing");
      setSubmitting(false);
      setPaymentStatusLabel(null);
      setStep(3);

      if (verifiedStatus !== "successful") {
        // Start silent background polling — the receipt screen will update live.
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        pollTransactionStatus(reference, token as string, txnData);
      } else {
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
      }

    } catch (error: any) {
      toast.error(error.message);
      setSubmitting(false);
      setPaymentStatusLabel(null);
    }
  };


  if (step === 3 && resultTxn) {
    const isProcessing = txnStatus === "processing";
    const isFailed = txnStatus === "failed";
    const isSuccess = txnStatus === "successful";
    const provider = providers.find((p: any) => p.id === (resultTxn.bill_provider_id ?? formValues?.providerId));
    const providerName = provider?.name ?? resultTxn.provider_name ?? formValues?.providerId;
    const customerId = resultTxn.customer ?? formValues?.identifier;
    const tokenValue = resultTxn.token ?? resultTxn.metadata?.token ?? null;

    return (
      <div className="mx-auto max-w-md py-8 animate-in fade-in zoom-in duration-300">
        <div className="rounded-2xl border bg-card shadow-card relative overflow-hidden">

          {/* ── Colour band at top changes with status ── */}
          <div className={[
            "h-2 w-full",
            isProcessing ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 animate-pulse" : "",
            isSuccess ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "",
            isFailed ? "bg-destructive" : "",
          ].join(" ")} />

          <div className="p-6 sm:p-8 text-center">

            {/* ── Status icon ── */}
            {isProcessing && (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 ring-8 ring-amber-500/5">
                <div className="h-10 w-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              </div>
            )}
            {isSuccess && (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            )}
            {isFailed && (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" d="M12 8v4m0 4h.01" strokeWidth="2" />
                </svg>
              </div>
            )}

            {/* ── Headline ── */}
            {isProcessing && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight">Payment Received!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your payment was confirmed. We&apos;re now delivering your {title.toLowerCase()}&#8202;—&#8202;this usually takes a few seconds.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Processing in background
                </div>
              </>
            )}
            {isSuccess && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight text-emerald-600">Delivered!</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your {title.toLowerCase()} has been delivered successfully.</p>
              </>
            )}
            {isFailed && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight text-destructive">Delivery Failed</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {txnErrorMessage ?? "We could not deliver your bill. Your wallet will be refunded automatically."}
                </p>
              </>
            )}

            {/* ── Receipt card ── */}
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5 text-left text-sm shadow-sm">
              <div className="flex flex-col space-y-3">

                {/* Amount — always shown */}
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-border">
                  <span className="text-muted-foreground font-medium">Amount Paid</span>
                  <span className="text-2xl font-black">{formatNaira(resultTxn.amount ?? formValues?.amount)}</span>
                </div>

                {providerName && <Row label="Provider" value={<span className="font-semibold">{providerName}</span>} />}
                {customerId && <Row label="Customer" value={<span className="font-medium">{customerId}</span>} />}
                {(formValues?.planName || resultTxn.product_name) && (
                  <Row label="Plan" value={formValues?.planName || resultTxn.product_name} />
                )}

                {/* Token / PIN — shown once delivered */}
                {isSuccess && tokenValue && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Your Token / PIN</p>
                    <p className="text-xl font-mono font-black tracking-[0.25em] text-emerald-700 dark:text-emerald-300 select-all">{tokenValue}</p>
                    <p className="mt-1 text-[10px] text-emerald-500">Tap to select &amp; copy</p>
                  </div>
                )}

                {/* Processing placeholder for token */}
                {isProcessing && (
                  <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                    <p className="text-xs text-amber-600 font-medium">Token / confirmation details will appear here once delivered</p>
                  </div>
                )}

                <Row
                  label="Reference"
                  value={<span className="font-mono text-xs bg-muted px-2 py-1 rounded select-all">{resultTxn.reference ?? formValues?.reference}</span>}
                />

                {/* Status badge */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground font-medium">Status</span>
                  {isProcessing && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />Processing</span>}
                  {isSuccess && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />Delivered</span>}
                  {isFailed && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-destructive">Failed</span>}
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-semibold"
                onClick={() => router.push("/account/transactions")}
              >
                View History
              </Button>
              {isFailed ? (
                <Button
                  className="flex-1 font-semibold bg-destructive hover:bg-destructive/90"
                  onClick={() => { setStep(2); setTxnStatus("processing"); setTxnErrorMessage(null); }}
                >
                  Try Again
                </Button>
              ) : (
                <Button
                  className="flex-1 font-semibold"
                  onClick={() => {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setStep(1);
                    setValue("identifier", "");
                    setValue("amount", "");
                    setResultTxn(null);
                    setTxnStatus("processing");
                  }}
                >
                  {isProcessing ? "Pay Another" : "Done"}
                </Button>
              )}
            </div>

            {/* ── Processing footnote ── */}
            {isProcessing && (
              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                This screen updates automatically. You can safely navigate away — we&apos;ll deliver your bill in the background and you can track progress in your transaction history.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl sm:space-y-4">
      <div className="rounded-none border-x-0 border-t-0 border-b bg-card pb-6 sm:rounded-3xl sm:border sm:shadow-card sm:pb-8">
        {/* App-like Header */}
        <div className="mb-6 flex items-center justify-between border-b bg-muted/20 p-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => step === 2 ? setStep(1) : router.push("/account/services")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border transition hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none tracking-tight sm:text-xl">{title}</h1>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={step === 1 ? 'text-primary font-bold' : ''}>Step {step}</span>
                <span>&middot;</span>
                <span>{step === 1 ? "Fill details" : "Review"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center rounded-xl bg-primary/5 px-3 py-1.5 text-right ring-1 ring-primary/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70">Balance</span>
            <span className="text-sm font-black tracking-tight text-primary sm:text-base">{formatNaira(balance)}</span>
          </div>
        </div>

        <div className="px-4 sm:px-8">
          {step === 1 && (
            <form onSubmit={handleSubmit(onReview)} noValidate className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
              <DynamicFormFields
                fields={config.fields}
                control={control}
                watch={watch}
                setValue={setValue}
                providers={providers}
                products={products}
                category={groupSlug}
                verifiedData={verifiedData}
                setVerifiedData={setVerifiedData}
              />

              <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg">
                Continue to Review
              </Button>
            </form>
          )}

          {step === 2 && formValues && (
            <ReviewAndPay
              title={title}
              items={buildSummaryItems(formValues, providers, verifiedData)}
              amount={Number(formValues.amount)}
              balance={balance}
              gateways={gateways}
              selectedGatewayId={selectedGatewayId}
              onSelectGateway={setSelectedGatewayId}
              onEdit={() => setStep(1)}
              onPay={handlePay}
              submitting={submitting}
              paymentStatusLabel={paymentStatusLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Build summary items generically from form values — keeps Step 2 identical for every service. */
function buildSummaryItems(
  formValues: Record<string, any>,
  providers: any[],
  verifiedData: any
): any[] {
  const items: any[] = [];

  // Provider
  const provider = providers.find((p) => p.id === formValues.providerId);
  if (provider) {
    items.push({ label: "Provider", value: provider.name });
  }

  // Customer / Identifier
  if (formValues.identifier) {
    items.push({ label: "Customer ID", value: formValues.identifier });
  }

  // Verified customer name (from meter/smartcard lookup)
  if (verifiedData?.customer_name) {
    items.push({ label: "Customer Name", value: verifiedData.customer_name });
  }

  // Plan
  if (formValues.planName) {
    items.push({ label: "Plan", value: formValues.planName });
  }

  // Quantity
  if (formValues.quantity && formValues.quantity > 1) {
    items.push({ label: "Quantity", value: String(formValues.quantity) });
  }

  // Phone (when different from identifier, e.g. electricity token delivery)
  if (formValues.phone && formValues.phone !== formValues.identifier) {
    items.push({ label: "Phone", value: formValues.phone });
  }

  // Student name (education)
  if (formValues.studentName) {
    items.push({ label: "Student Name", value: formValues.studentName });
  }

  // Email (collections)
  if (formValues.email) {
    items.push({ label: "Email", value: formValues.email });
  }

  // Reference (collections)
  if (formValues.reference) {
    items.push({ label: "Reference", value: formValues.reference });
  }

  return items;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1"><span className="text-muted-foreground">{label}</span><span className="text-right text-foreground">{value}</span></div>;
}
