"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet, usePaymentGateways } from "@/hooks/useGapcastle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Loader2, Search, UserCheck, Wallet, Camera } from "lucide-react";
import { toast } from "sonner";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useTransactionDetail } from "@/hooks/useGapcastle";
import { TransactionReport } from "@/components/TransactionReport";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/ui/CameraCapture";

export interface KycFlowProps {
  initialProviders?: any[];
  initialWallet?: any;
}

export function KycFlow({ initialProviders = [], initialWallet }: KycFlowProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const { data: wallet } = useWallet(initialWallet);
  const { data: gateways = [] } = usePaymentGateways();

  // Data processing
  const zeehProvider = initialProviders.find(p => p.slug === "zeeh_africa" || p.slug.includes("zeeh"));
  const products = zeehProvider?.products || [];

  const countries = Array.from(new Set(products.map((p: any) => p.metadata?.country_name).filter(Boolean))) as string[];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [resultTxn, setResultTxn] = useState<any>(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;
    const token = session?.accessToken;
    if (!token) return toast.error("Session expired.");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: formData
      });

      let result;
      const text = await res.text();
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response received:", text);
        throw new Error("Server returned an invalid response. Check console for details.");
      }

      if (!res.ok) throw new Error(result.message || "Upload failed");

      handleInputChange(field, result.data.url);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  // Fetch detailed transaction when a transaction is successful
  const { data: txnDetail, isLoading: isLoadingDetail } = useTransactionDetail(step === 3 && resultTxn ? resultTxn.id : null);
  const activeTxn = txnDetail || resultTxn;

  useEffect(() => {
    if (gateways.length > 0 && !selectedGatewayId) {
      const walletGateway = gateways.find((g: any) => g.slug === 'wallet');
      if (walletGateway) setSelectedGatewayId(walletGateway.id);
      else setSelectedGatewayId(gateways[0].id);
    }
  }, [gateways, selectedGatewayId]);

  const countryProducts = products.filter((p: any) => p.metadata?.country_name === selectedCountry);

  const balance = Number(wallet?.balance ?? 0);

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const onReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return toast.error("Please select a country");
    if (!selectedProduct) return toast.error("Please select a KYC product");

    // Validate required fields
    const requiredFields = selectedProduct.metadata?.label_name || [];
    for (const field of requiredFields) {
      if (!formValues[field] || formValues[field].trim() === "") {
        return toast.error(`Please provide ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    }

    setStep(2);
  };

  const handlePay = async () => {
    const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);
    if (selectedGateway?.slug === 'wallet' && Number(selectedProduct.amount) > balance) {
      return toast.error("Insufficient wallet balance. Fund your wallet or select another payment method.");
    }

    setSubmitting(true);
    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Session expired. Please log in again.");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

      const payload: any = {
        bill_service_slug: "kyc",
        bill_provider_id: zeehProvider.id,
        bill_product_id: selectedProduct.id,
        customer: formValues[selectedProduct.metadata?.label_name?.[0]] || "Customer",
        amount: Number(selectedProduct.amount),
        metadata: {
          ...formValues,
          country: selectedCountry,
          endpoint: selectedProduct.metadata?.endpoint,
        },
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
      <div className="mx-auto max-w-md py-8 animate-in fade-in duration-300">
        <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-success/10 to-transparent" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success ring-8 ring-success/5 mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">KYC Successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your identity verification was processed successfully.</p>

            <div className="bg-card mt-6 rounded-xl p-5 text-left text-sm border border-border shadow-sm">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-success">Verified</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold text-right max-w-[60%]">{resultTxn.metadata?.customerName || resultTxn.customer}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-semibold text-right max-w-[60%]">{selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{activeTxn.reference}</span>
                </div>
              </div>
            </div>

            {activeTxn.response && (
              <Button
                variant="default"
                className="w-full mt-6 h-11 rounded-xl text-sm font-semibold"
                onClick={() => setShowReport(true)}
                disabled={isLoadingDetail}
              >
                {isLoadingDetail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                View Full Report
              </Button>
            )}

            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/app/transactions")}>History</Button>
              <Button className="flex-1" onClick={() => { setStep(1); setFormValues({}); setResultTxn(null); setSelectedProduct(null); }}>Done</Button>
            </div>
          </div>
        </div>

        {/* Detailed Report Dialog */}
        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
            {activeTxn && (
              <TransactionReport transaction={activeTxn} onClose={() => setShowReport(false)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <button onClick={() => step === 2 ? setStep(1) : router.push("/app/services")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back
      </button>

      <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-card">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verify identity and documents securely.</p>
        </div>

        {step === 1 && (
          <form onSubmit={onReview} className="space-y-6 animate-in fade-in duration-300">
            {/* Country Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">1. Select Country</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {countries.map(country => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => { setSelectedCountry(country); setSelectedProduct(null); setFormValues({}); }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-sm transition-all ${selectedCountry === country ? "border-primary bg-primary/5 font-semibold text-primary ring-1 ring-primary" : "bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted"
                      }`}
                  >
                    <UserCheck className="h-6 w-6" />
                    {country}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            {selectedCountry && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-base font-semibold">2. Select Product</Label>
                <Combobox
                  value={selectedProduct?.name || ""}
                  onValueChange={(val) => {
                    const prod = countryProducts.find((p: any) => p.name === val);
                    if (prod) {
                      setSelectedProduct(prod);
                      setFormValues({});
                    }
                  }}
                >
                  <ComboboxInput
                    placeholder="Search for a verification service..."
                    showTrigger
                    className="h-14 w-full rounded-xl bg-card border-input shadow-sm text-base transition-shadow focus-within:ring-2 focus-within:ring-primary/20"
                  />
                  <ComboboxContent className="max-h-[350px] p-1.5 border shadow-xl rounded-xl">
                    <ComboboxList className="p-0">
                      {countryProducts.map((prod: any) => (
                        <ComboboxItem
                          key={prod.id}
                          value={prod.name}
                          className="py-3 px-3 mb-1 cursor-pointer rounded-lg transition-colors data-[highlighted]:bg-muted/60"
                        >
                          <div className="flex flex-1 justify-between items-center w-full pr-4">
                            <span className="font-medium text-foreground">{prod.name}</span>
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold border border-emerald-500/20">
                              {formatNaira(prod.amount)}
                            </span>
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}

            {/* Dynamic Inputs */}
            {selectedProduct && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-base font-semibold">3. Enter Details</Label>
                <div className="space-y-4">
                  {(selectedProduct.metadata?.label_name || []).map((field: string) => {
                    const isImageField = ['image', 'imageUrl', 'photo', 'document', 'passport'].some(imgField => field.toLowerCase().includes(imgField.toLowerCase()));
                    return (
                      <div key={field} className="space-y-1.5">
                        <Label className="capitalize text-sm font-medium">{field.replace(/_/g, ' ').replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</Label>
                        {isImageField ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 rounded-xl bg-muted/50 border-dashed"
                                onClick={() => setActiveCameraField(field)}
                                disabled={uploading[field]}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Take Photo
                              </Button>
                              <div className="relative flex-1">
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(field, e.target.files[0]);
                                    }
                                  }}
                                  disabled={uploading[field]}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-11 rounded-xl bg-muted/50 pointer-events-none"
                                  disabled={uploading[field]}
                                >
                                  Upload File
                                </Button>
                              </div>
                            </div>
                            {uploading[field] && <p className="text-xs text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
                            {formValues[field] && !uploading[field] && (
                              <div className="mt-2 relative rounded-xl overflow-hidden border border-emerald-200 bg-muted w-24 h-24 sm:w-32 sm:h-32 shadow-sm">
                                {formValues[field].toLowerCase().endsWith('.pdf') ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center text-xs text-muted-foreground bg-emerald-50">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                                    PDF Uploaded
                                  </div>
                                ) : (
                                  <img
                                    src={formValues[field]}
                                    alt="Uploaded Preview"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute top-1.5 right-1.5">
                                  <div className="bg-emerald-500 text-white rounded-full shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Input
                            value={formValues[field] || ""}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={`Enter ${field.replace(/_/g, ' ').replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                            className="h-11 rounded-xl bg-muted/50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button type="submit" disabled={!selectedCountry || !selectedProduct} className="w-full h-12 rounded-xl font-bold text-base mt-6">
              Continue
            </Button>
          </form>
        )}

        {step === 2 && selectedProduct && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Review Request</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span className="font-medium">{selectedCountry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>

                {Object.entries(formValues).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ').replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}

                <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Cost</span>
                  <span className="text-xl font-black">{formatNaira(selectedProduct.amount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Payment Method</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {gateways.map((g: any) => {
                  const Icon = g.slug === 'wallet' ? Wallet : Search;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGatewayId(g.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${selectedGatewayId === g.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:border-primary/50"
                        }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedGatewayId === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${selectedGatewayId === g.id ? "text-primary" : "text-foreground"}`}>{g.name}</p>
                        {g.slug === 'wallet' && <p className="text-xs text-muted-foreground font-medium mt-0.5">Balance: {formatNaira(wallet?.balance)}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={handlePay} disabled={submitting} className="w-full h-12 rounded-xl font-bold text-base">
              {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : `Pay ${formatNaira(selectedProduct.amount)}`}
            </Button>
          </div>
        )}
      </div>

      {/* Camera Capture Dialog */}
      <Dialog open={!!activeCameraField} onOpenChange={(open) => !open && setActiveCameraField(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          {activeCameraField && (
            <CameraCapture
              onCancel={() => setActiveCameraField(null)}
              onCapture={(file) => {
                setActiveCameraField(null);
                handleFileUpload(activeCameraField, file);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
