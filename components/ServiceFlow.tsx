"use client";
import React, { useState, useEffect, useMemo } from "react";
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

  if (!config) {
    return <div className="p-8 text-center text-destructive font-semibold">Service configuration not found for: {category}</div>;
  }

  const balance = Number(wallet?.balance ?? 0);
  const title = overrideTitle || config.title;

  const onReview = (data: any) => {
    setFormValues(data);
    setStep(2);
  };

  const handlePay = async () => {
    const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);
    if (selectedGateway?.slug === 'wallet' && Number(formValues.amount) > balance) {
      return toast.error("Insufficient wallet balance. Fund your wallet or select another payment method.");
    }

    setSubmitting(true);
    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Session expired. Please log in again.");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

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

      if (result.data?.payment_url) {
        window.location.href = result.data.payment_url;
        return;
      }

      setResultTxn(result.data || result);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setStep(3);
    } catch (error: any) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  if (step === 3 && resultTxn) {
    return (
      <div className="mx-auto max-w-md py-8 animate-in fade-in zoom-in duration-300">
        <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-success/10 to-transparent" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success ring-8 ring-success/5 mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Payment Successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your {title.toLowerCase()} was processed successfully.</p>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t-2 border-dashed border-border"></div>
              </div>
            </div>

            <div className="bg-card mt-6 rounded-xl p-5 text-left text-sm border border-border shadow-sm">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-dashed border-border">
                  <span className="text-muted-foreground font-medium">Amount Paid</span>
                  <span className="text-2xl font-black text-foreground">{formatNaira(resultTxn.amount)}</span>
                </div>
                <Row label="Provider" value={<span className="font-medium">{resultTxn.provider_name || formValues.providerId}</span>} />
                <Row label="Customer" value={<span className="font-medium">{resultTxn.identifier || formValues.identifier}</span>} />
                {(planName || resultTxn.product_name) && <Row label="Plan" value={resultTxn.product_name || planName} />}
                {resultTxn.token && (
                  <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/20 text-center">
                    <p className="text-xs font-semibold uppercase text-primary mb-1">Generated Token / PIN</p>
                    <p className="text-lg font-mono font-bold tracking-widest text-foreground">{resultTxn.token}</p>
                  </div>
                )}
                <Row label="Reference" value={<span className="font-mono text-xs bg-muted px-2 py-1 rounded">{resultTxn.reference}</span>} />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1 font-semibold" onClick={() => router.push("/account/transactions")}>History</Button>
              <Button className="flex-1 font-semibold" onClick={() => { setStep(1); setValue("identifier", ""); setValue("amount", ""); setResultTxn(null); }}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl sm:space-y-4">
      <div className="overflow-hidden rounded-none border-x-0 border-t-0 border-b bg-card pb-6 sm:rounded-3xl sm:border sm:shadow-card sm:pb-8">
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
            <form onSubmit={handleSubmit(onReview)} className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
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
