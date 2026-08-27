import React, { useState, useEffect } from "react";
import { Control, Controller, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ServiceFieldConfig } from "@/lib/services/registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioCardGroup, RadioCard } from "@/components/ui/RadioCardGroup";
import { formatNaira, detectNetwork } from "@/lib/format";
import { useSession } from "next-auth/react";
import { useVerify } from "@/hooks/useGapcastle";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProviderSelect } from "@/components/ui/ProviderSelect";
import { ProductSelect } from "@/components/ui/ProductSelect";
import { InsuranceFields } from "@/components/InsuranceFields";

interface DynamicFormFieldsProps {
  fields: ServiceFieldConfig[];
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  providers: any[];
  products: any[];
  category: string;
  verifiedData: any;
  setVerifiedData: (data: any) => void;
}

export function DynamicFormFields({
  fields,
  control,
  watch,
  setValue,
  providers,
  products,
  category,
  verifiedData,
  setVerifiedData
}: DynamicFormFieldsProps) {
  const { data: session } = useSession();
  const hasToken = !!session?.accessToken;
  const { verify } = useVerify();
  const [verifying, setVerifying] = useState(false);
  // Local state for education WAV-validated plans — independent of the parent
  // verifiedData prop so timing of prop propagation can't cause stale renders.
  const [wavPlans, setWavPlans] = useState<any[]>([]);

  const values = watch();
  const providerId = values.providerId;
  const provider = providers.find(p => p.id === providerId);

  // Recalculate amount when period changes for cable TV (price × months).
  const watchedPeriod = watch("period");
  const watchedVariationCode = watch("variationCode");
  useEffect(() => {
    if (category !== "cable" || !verifiedData?.plans?.length) return;
    const plan = verifiedData.plans.find((p: any) => p.variation_code === watchedVariationCode);
    if (!plan) return;
    const months = Math.max(1, Number(watchedPeriod) || 1);
    setValue("amount", Number(plan.amount) * months);
  }, [watchedPeriod, watchedVariationCode]);

  // Recalculate amount when quantity changes for education (WAV live price × qty).
  const watchedQuantity = watch("quantity");
  useEffect(() => {
    if (category !== "education" || !wavPlans.length) return;
    const livePrice = wavPlans[0]?.amount;
    if (!livePrice) return;
    const qty = Math.max(1, Number(watchedQuantity) || 1);
    setValue("amount", Number(livePrice) * qty);
  }, [watchedQuantity, wavPlans]);

  // Shared function: call Ringo WAV and populate wavPlans + form fields.
  // Extracted so it can be triggered from both the useEffect and the
  // provider_grid onChange handler without duplicating the logic.
  const runWavValidation = (selectedProvider: any) => {
    setVerifying(true);
    setWavPlans([]);
    setVerifiedData(null);
    setValue("planId", undefined);
    verify({
      service: category,
      provider_code: selectedProvider.slug || selectedProvider.code,
      billers_code: "WAEC",
    }).then(res => {
      setVerifiedData(res);
      if (res?.is_valid !== false && res?.plans?.length > 0) {
        setWavPlans(res.plans);
        const livePrice = Number(res.plans[0].amount);
        const qty = Math.max(1, Number(watch("quantity")) || 1);
        setValue("planId", res.plans[0].id);
        setValue("variationCode", "WAEC");
        setValue("planName", products[0]?.name || selectedProvider.name || "WAEC Result Checker PIN");
        setValue("amount", livePrice * qty);
      }
    }).catch((err: any) => {
      toast.error(err?.message || "Could not fetch WAEC price. Please try again.");
    }).finally(() => setVerifying(false));
  };

  // Clear Smile plan list when the user switches between bundle and recharge.
  const watchedInternetType = watch("internet_type");
  useEffect(() => {
    if (category !== "internet") return;
    setVerifiedData(null);
    setValue("planId", undefined);
    setValue("amount", "");
  }, [watchedInternetType]);

  // Auto-validate WAEC when education provider changes (covers ServiceFlow
  // auto-select on mount). Deps include providers.length (re-fires if providers
  // loaded after the id was set) and hasToken (re-fires once the NextAuth
  // session hydrates — the token is needed by fetchApi).
  const watchedProviderId = watch("providerId");
  useEffect(() => {
    if (category !== "education" || !watchedProviderId || !providers.length || !hasToken) return;
    const selectedProvider = providers.find((p: any) => p.id === watchedProviderId);
    if (!selectedProvider) return;
    runWavValidation(selectedProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedProviderId, providers.length, hasToken]);

  const handleVerify = async (fieldName: string) => {
    const ident = values[fieldName];
    if (!ident) return toast.error("Please enter a value to verify");
    if (!provider) return toast.error("Please select a provider first");

    setVerifying(true);
    setVerifiedData(null);
    try {
      // Prompt specification: POST verify with { service, provider_code, billers_code, type }
      const res = await verify({
        service: category,
        provider_code: provider.slug || provider.code,
        billers_code: ident,
        // `type` carries the meter type (electricity), the bouquet action
        // (cable), or the Smile mode (internet bundle/recharge).
        type: values.meterType || values.transactionType || values.internet_type
      });
      setVerifiedData(res);
      
      if (res.is_valid === false) {
        toast.error(res.message || "Verification failed");
      } else {
        toast.success("Verified successfully!");
        // Auto-fill amount if verification returns minimum amount or exact amount
        if (res.minimum_amount) setValue("amount", Number(res.minimum_amount));
        else if (res.metadata?.minimumPayable) setValue("amount", Number(res.metadata.minimumPayable));
        else if (res.amount) setValue("amount", Number(res.amount));
        else if (res.metadata?.Renewal_Amount) setValue("amount", Number(res.metadata.Renewal_Amount));
        else if (category === "cable" && values.transactionType === "renew") setValue("amount", 5000); // Sandbox fallback

        // Auto-select Smile AccountId if present
        const accList = res.metadata?.AccountList?.Account;
        if (accList) {
          const accounts = Array.isArray(accList) ? accList : [accList];
          if (accounts.length > 0) {
            setValue("accountId", accounts[0].AccountId);
          }
        }

        // Internet (Smile): auto-select the first plan returned by validation
        // so the dropdown shows a real selection (not just a visual default).
        // planId 0 is valid — never use !planId to check it.
        if (category === "internet" && res.plans?.length > 0) {
          const first = res.plans[0];
          setValue("planId", first.id);
          setValue("planName", first.name || "Data Plan");
          setValue("variationCode", first.variation_code || first.code || "");
          setValue("allowance", first.allowance ?? "");
          setValue("validity", first.validity ?? "");
          setValue("amount", Number(first.amount));
        }
      }
    } catch (err: any) {
      setVerifiedData({ is_valid: false, message: err.message || "Verification failed" });
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const isHidden = field.isHidden && field.isHidden({ ...values, providerSlug: provider?.slug });

        // Insurance fields — self-contained component with its own cascading state
        if (field.type === "insurance_fields") {
          return (
            <InsuranceFields key="insurance_fields" control={control} watch={watch} setValue={setValue} />
          );
        }

        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}

            render={({ field: formField, fieldState }) => (
              <div className={`space-y-2 ${isHidden ? 'hidden' : ''}`}>
                <Label htmlFor={field.name} className={fieldState.error ? "text-destructive" : ""}>
                  {field.label}
                </Label>

                {field.type === "provider_grid" && (
                  providers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                      <p className="text-sm font-medium text-foreground">No providers available right now</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This service is temporarily unavailable through our current provider. Please check back shortly.
                      </p>
                    </div>
                  ) : (
                    <ProviderSelect
                      providers={providers}
                      value={formField.value}
                      onValueChange={(val) => {
                        formField.onChange(val);
                        setValue("planId", undefined);
                        const selected = providers.find((p) => p.id === val);
                        setValue("providerSlug", selected?.slug ?? "");
                        // Education: immediately fire WAV so the plan_grid
                        // updates without waiting for the watchedProviderId effect.
                        if (category === "education" && selected) {
                          runWavValidation(selected);
                        }
                      }}
                    />
                  )
                )}

                {field.type === "plan_grid" && (() => {
                  let visibleProducts = products;
                  if (category === "credit_check" && values.requestType) {
                    visibleProducts = products.filter(p => p.metadata?.request_type === values.requestType);
                  }
                  // Education: replace DB products with WAV live-priced plan.
                  // wavPlans is local state set directly from the WAV response —
                  // independent of verifiedData prop timing.
                  if (category === "education" && wavPlans.length > 0) {
                    visibleProducts = wavPlans.map((p: any) => ({
                      ...p,
                      name: p.name || products[0]?.name || "WAEC Result Checker PIN",
                      variation_code: p.variation_code || "WAEC",
                    }));
                  }
                  // Internet (Smile): replace DB products with live plans returned
                  // by SRV (recharge) or V-Internet/SMILE (bundle) validation.
                  // DB has no Smile products (fetchProducts returns []).
                  if (category === "internet" && verifiedData?.plans?.length > 0) {
                    visibleProducts = verifiedData.plans.map((p: any) => ({
                      ...p,
                      name: p.name || "Data Plan",
                      variation_code: p.variation_code || p.code || "",
                    }));
                  }

                  const handlePlanSelect = (numVal: number) => {
                    formField.onChange(numVal);
                    const selectedPlan = visibleProducts.find(p => p.id === numVal);
                    if (selectedPlan) {
                      const baseAmt = Number(selectedPlan.amount);
                      const qty = category === "education" ? Math.max(1, Number(values.quantity) || 1) : 1;
                      setValue("amount", baseAmt * qty);
                      setValue("planName", selectedPlan.name);
                      setValue("variationCode", selectedPlan.variation_code || "");
                      // Smile Bundle purchase requires allowance + validity in metadata.
                      if (category === "internet") {
                        setValue("allowance", selectedPlan.allowance ?? "");
                        setValue("validity", selectedPlan.validity ?? "");
                      }
                    }
                  };

                  return (
                    <div className="space-y-2">
                      {!providerId && <p className="text-sm text-muted-foreground">Select a provider to see plans</p>}
                      {/* Education: skeleton while WAV is loading */}
                      {category === "education" && verifying && <Skeleton className="h-16 w-full" />}
                      {providerId && !verifying && visibleProducts.length === 0 && (
                        <p className="text-sm text-muted-foreground">No plans available.</p>
                      )}
                      {providerId && !verifying && visibleProducts.length > 0 && (
                        <ProductSelect
                          products={visibleProducts}
                          value={formField.value}
                          onValueChange={handlePlanSelect}
                        />
                      )}
                      {category === "education" && verifiedData?.is_valid === false && !verifying && !wavPlans.length && (
                        <div className="rounded-lg p-3 border bg-destructive/10 border-destructive/20 text-sm">
                          <p className="font-bold text-destructive">{verifiedData.message || "Price check failed — please try again."}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {field.type === "verify_input" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        {...formField}
                        id={field.name}
                        placeholder={field.placeholder}
                        disabled={verifying}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleVerify(field.name)}
                        disabled={verifying || !formField.value}
                      >
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    {/* Verification Result Area */}
                    {verifying && <Skeleton className="h-16 w-full" />}
                    {verifiedData && !verifying && (
                      <div className={`rounded-lg p-4 border text-sm ${verifiedData.is_valid === false ? 'bg-destructive/10 border-destructive/20' : 'bg-success/10 border-success/20'}`}>
                        {verifiedData.is_valid === false ? (
                          <p className="font-bold text-destructive">{verifiedData.message || "Verification failed"}</p>
                        ) : (
                          <>
                            <p className="font-bold text-primary">{verifiedData.customer_name || verifiedData.name}</p>
                            {verifiedData.address && <p className="text-muted-foreground text-xs mt-1">{verifiedData.address}</p>}
                            {verifiedData.current_bouquet && <p className="text-muted-foreground text-xs mt-1">Current Plan: {verifiedData.current_bouquet}</p>}
                            {verifiedData.metadata?.Status && <p className="text-muted-foreground text-xs mt-1">Status: {verifiedData.metadata.Status}</p>}
                            {verifiedData.metadata?.Due_Date && <p className="text-muted-foreground text-xs mt-1">Due Date: {new Date(verifiedData.metadata.Due_Date).toLocaleDateString()}</p>}
                            {verifiedData.metadata?.Customer_Type && <p className="text-muted-foreground text-xs mt-1">Type: {verifiedData.metadata.Customer_Type}</p>}
                            
                            {/* Cable TV bouquet selector — populated from Ringo V-TV response */}
                            {category === "cable" && verifiedData.plans?.length > 0 && (
                              <div className="mt-4 space-y-2 border-t pt-3">
                                <Label className="text-xs font-semibold">Select Bouquet / Package</Label>
                                <Select
                                  value={values.variationCode || ""}
                                  onValueChange={(code) => {
                                    const plan = verifiedData.plans.find((p: any) => p.variation_code === code);
                                    if (plan) {
                                      setValue("variationCode", plan.variation_code);
                                      setValue("amount", Number(plan.amount));
                                      setValue("planName", plan.name);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a bouquet..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {verifiedData.plans
                                      .filter((p: any) => Number(p.amount) > 0)
                                      .map((plan: any) => (
                                        <SelectItem key={plan.variation_code} value={plan.variation_code}>
                                          {plan.name} — {formatNaira(plan.amount)}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Smile Network Accounts */}
                            {verifiedData.metadata?.AccountList?.Account && (() => {
                              const accList = verifiedData.metadata.AccountList.Account;
                              const accounts = Array.isArray(accList) ? accList : [accList];
                              if (accounts.length === 0) return null;
                              return (
                                <div className="mt-4 space-y-2 border-t pt-3">
                                  <Label className="text-xs font-semibold">Select Smile Account to Fund</Label>
                                  <Select
                                    value={values.accountId || ""}
                                    onValueChange={(val) => setValue("accountId", val)}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select an account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {accounts.map((acc: any) => (
                                        <SelectItem key={acc.AccountId} value={acc.AccountId}>
                                          {acc.FriendlyName} ({acc.AccountId})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" || field.type === "date") && (
                  <>
                    <Input
                      {...formField}
                      id={field.name}
                      type={field.type === "phone" ? "tel" : field.type}
                      placeholder={field.placeholder}
                      readOnly={field.readonly}
                      className={field.readonly ? "bg-muted/50" : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (field.type === "number") {
                          formField.onChange(val ? Number(val) : "");
                        } else {
                          formField.onChange(val);
                        }
                        // Airtime/Data: auto-select the network from the phone prefix.
                        if (field.type === "phone" && (category === "airtime" || category === "data")) {
                          const net = detectNetwork(val);
                          const match = net ? providers.find((p) => p.slug === net) : undefined;
                          if (match && match.id !== values.providerId) {
                            setValue("providerId", match.id);
                            setValue("providerSlug", match.slug);
                            if (category === "data") setValue("planId", undefined);
                          }
                        }
                      }}
                    />
                    {field.type === "phone" && (category === "airtime" || category === "data") && (() => {
                      const net = detectNetwork(values[field.name] || "");
                      if (!net) return null;
                      const label = ({ mtn: "MTN", glo: "Glo", airtel: "Airtel", "9mobile": "9mobile" } as Record<string, string>)[net] ?? net;
                      const mismatch = provider && provider.slug !== net;
                      return (
                        <p className={`mt-1.5 text-xs font-medium ${mismatch ? "text-amber-600" : "text-emerald-600"}`}>
                          {mismatch ? `This looks like a ${label} number, not ${provider?.name}.` : `${label} number detected`}
                        </p>
                      );
                    })()}
                  </>
                )}

                {field.type === "amount_quick_select" && (
                  <div className="space-y-3">
                    <Input
                      {...formField}
                      id={field.name}
                      type="number"
                      placeholder="0.00"
                      onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : "")}
                    />
                    <div className="flex flex-wrap gap-2">
                      {[100, 200, 500, 1000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => formField.onChange(amt)}
                          className="rounded-full border px-3 py-1 text-xs hover:border-primary hover:bg-primary/10 transition-colors"
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {field.type === "radio" && field.options && (
                  <RadioCardGroup
                    value={formField.value}
                    onValueChange={formField.onChange}
                    className="grid-cols-2"
                  >
                    {field.options.map((opt: any) => (
                      <RadioCard key={opt.value} value={opt.value.toString()} className="py-3">
                        <span className="text-sm font-medium">{opt.label}</span>
                      </RadioCard>
                    ))}
                  </RadioCardGroup>
                )}

                {field.type === "select" && field.options && (
                  <Select value={formField.value} onValueChange={formField.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "textarea" && (
                  <textarea
                    {...formField}
                    id={field.name}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={field.placeholder}
                  />
                )}

                {fieldState.error && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        );
      })}
    </div>
  );
}
