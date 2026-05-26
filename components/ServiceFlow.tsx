"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet, useProviders, usePaymentGateways } from "@/hooks/useGapcastle";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Loader2, Wallet, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { serviceRegistry } from "@/lib/services/registry";
import { DynamicFormFields } from "@/components/DynamicFormFields";

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
              <Button variant="outline" className="flex-1 font-semibold" onClick={() => router.push("/app/transactions")}>History</Button>
              <Button className="flex-1 font-semibold" onClick={() => { setStep(1); setValue("identifier", ""); setValue("amount", ""); setResultTxn(null); }}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <button onClick={() => step === 2 ? setStep(1) : router.push("/app/services")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back
      </button>

      <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Step {step} of 2
              </span>
              <span className="text-sm text-muted-foreground">{step === 1 ? "Fill details" : "Review order"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-br from-card to-muted/50 px-4 py-2.5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Wallet Balance</span>
              <span className="text-lg font-bold leading-tight text-foreground">{formatNaira(balance)}</span>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
            {/* Left Column: Order Summary */}
            <div className="space-y-2 rounded-2xl bg-secondary/30 p-6 text-sm border h-fit">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <button onClick={() => setStep(1)} className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>
              
              <Row label="Service" value={title} />
              {providers.find(p => p.id === formValues.providerId) && (
                <Row label="Provider" value={
                  <span className="flex items-center gap-2 justify-end font-medium">
                    {providers.find(p => p.id === formValues.providerId)?.name}
                  </span>
                } />
              )}
              {formValues.identifier && <Row label="Customer ID" value={formValues.identifier} />}
              {verifiedData?.customer_name && <Row label="Customer Name" value={verifiedData.customer_name} />}
              {formValues.planName && <Row label="Plan" value={formValues.planName} />}
              {formValues.quantity && <Row label="Quantity" value={formValues.quantity} />}
              
              <div className="border-t pt-4 mt-4 space-y-2">
                <Row label="Amount" value={<span className="font-semibold">{formatNaira(formValues.amount)}</span>} />
                <Row label="Fee" value={formatNaira(0)} />
                <div className="flex justify-between gap-4 py-2 mt-2 bg-background rounded-lg px-3 border border-primary/20">
                    <span className="text-muted-foreground font-medium">Total to Pay</span>
                    <span className="text-xl font-black text-primary">{formatNaira(formValues.amount)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Select Payment Method</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose how you want to pay for this service.</p>
                
                <div className="space-y-3">
                  {gateways.map((gateway: any) => {
                    const isSelected = selectedGatewayId === gateway.id;
                    const isWallet = gateway.slug === 'wallet';
                    const hasInsufficientBalance = isWallet && Number(formValues.amount) > balance;
                    
                    return (
                      <button
                        key={gateway.id}
                        onClick={() => setSelectedGatewayId(gateway.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isWallet ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}>
                            {isWallet ? <Wallet className="h-5 w-5" /> : (gateway.logo_url ? <img src={gateway.logo_url} alt={gateway.name} className="h-6 w-6 object-contain" /> : <div className="h-5 w-5 bg-muted rounded-full" />)}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{gateway.name}</p>
                            {isWallet && (
                              <p className={`text-xs ${hasInsufficientBalance ? 'text-destructive' : 'text-muted-foreground'}`}>
                                Balance: {formatNaira(balance)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}>
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" size="lg" onClick={handlePay} disabled={submitting || !selectedGatewayId}>
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {submitting ? "Processing…" : `Pay ${formatNaira(formValues.amount)}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1"><span className="text-muted-foreground">{label}</span><span className="text-right text-foreground">{value}</span></div>;
}
