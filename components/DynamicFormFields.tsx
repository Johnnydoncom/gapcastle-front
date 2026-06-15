import React, { useState } from "react";
import { Control, Controller, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ServiceFieldConfig } from "@/lib/services/registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioCardGroup, RadioCard } from "@/components/ui/RadioCardGroup";
import { formatNaira } from "@/lib/format";
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
  const { verify } = useVerify();
  const [verifying, setVerifying] = useState(false);

  const values = watch();
  const providerId = values.providerId;
  const provider = providers.find(p => p.id === providerId);

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
        type: values.meterType || values.transactionType
      });
      setVerifiedData(res);
      
      if (res.is_valid === false) {
        toast.error(res.message || "Verification failed");
      } else {
        toast.success("Verified successfully!");
        // Auto-fill amount if verification returns minimum amount or exact amount
        if (res.minimum_amount) setValue("amount", Number(res.minimum_amount));
        else if (res.amount) setValue("amount", Number(res.amount));
        else if (res.metadata?.Renewal_Amount) setValue("amount", Number(res.metadata.Renewal_Amount));
        else if (category === "cable" && values.transactionType === "renew") setValue("amount", 5000); // Sandbox fallback
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
                  <ProviderSelect
                    providers={providers}
                    value={formField.value}
                    onValueChange={(val) => {
                      formField.onChange(val);
                      setValue("planId", undefined);
                    }}
                  />
                )}

                {field.type === "plan_grid" && (() => {
                  let visibleProducts = products;
                  if (category === "credit_check" && values.requestType) {
                    visibleProducts = products.filter(p => p.metadata?.request_type === values.requestType);
                  }

                  return (
                    <div className="space-y-2">
                      {!providerId && <p className="text-sm text-muted-foreground">Select a provider to see plans</p>}
                      {providerId && visibleProducts.length === 0 && <p className="text-sm text-muted-foreground">No plans available.</p>}
                      {providerId && visibleProducts.length > 0 && (
                        <ProductSelect
                          products={visibleProducts}
                          value={formField.value}
                          onValueChange={(numVal) => {
                            formField.onChange(numVal);
                            const selectedPlan = visibleProducts.find(p => p.id === numVal);
                            if (selectedPlan) {
                              setValue("amount", Number(selectedPlan.amount));
                              setValue("planName", selectedPlan.name);
                              setValue("variationCode", selectedPlan.variation_code);
                            }
                          }}
                        />
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" || field.type === "date") && (
                  <Input
                    {...formField}
                    id={field.name}
                    type={field.type === "phone" ? "tel" : field.type}
                    placeholder={field.placeholder}
                    readOnly={field.readonly}
                    className={field.readonly ? "bg-muted/50" : ""}
                    onChange={(e) => {
                      if (field.type === "number") {
                        formField.onChange(e.target.value ? Number(e.target.value) : "");
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
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
                    {field.options.map(opt => (
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
                      {field.options.map(opt => (
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
