"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet, usePaymentGateways, usePriceQuote, useServices } from "@/hooks/useGapcastle";
import { newIdempotencyKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Loader2, UserCheck, Camera, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { cleanKycValue, kycCustomer, kycDisplayValue, kycFieldError, kycFieldsFor, type KycField } from "@/lib/kyc-fields";
import { toast } from "sonner";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useTransactionDetail } from "@/hooks/useGapcastle";
import { TransactionReport } from "@/components/TransactionReport";
import { ReviewAndPay, type OrderSummaryItem } from "@/components/ReviewAndPay";
import { openGatewayModal } from "@/lib/gateway-sdk";
import { TransactionPinDialog } from "@/components/TransactionPinDialog";
import { TransactionPinError, assertPinAccepted } from "@/lib/transaction-pin";
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
  const { data: services = [], isSuccess: servicesLoaded } = useServices();

  // Data processing
  const zeehProvider = initialProviders.find(p => p.slug === "zeeh_africa" || p.slug.includes("zeeh"));
  const products = zeehProvider?.products || [];

  const countries = Array.from(new Set(products.map((p: any) => p.metadata?.country_name).filter(Boolean))) as string[];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** The selected lookup's form, as the API declares it. */
  const fields: KycField[] = kycFieldsFor(selectedProduct);
  const needsBank = fields.some((field) => field.type === "bank");
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [banksState, setBanksState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [bankPickerOpen, setBankPickerOpen] = useState<string | null>(null);
  // Confirms on the review step that the price listed is still the price charged.
  const { data: priceQuote, isFetching: quoteLoading, error: quoteError } = usePriceQuote(step === 2 && selectedProduct ? {
    serviceSlug: "kyc",
    providerId: zeehProvider?.id,
    productId: selectedProduct.id,
    amount: Number(selectedProduct.amount),
  } : null);

  const [submitting, setSubmitting] = useState(false);
  const [resultTxn, setResultTxn] = useState<any>(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
  /** Human-readable status shown below the Pay button while the modal / poll is active */
  const [paymentStatusLabel, setPaymentStatusLabel] = useState<string | null>(null);
  /** Live status of the transaction on the receipt screen */
  const [txnStatus, setTxnStatus] = useState<"processing" | "successful" | "failed">("processing");
  const [txnErrorMessage, setTxnErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;
    const token = session?.accessToken;
    if (!token) return toast.error("Session expired.");

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

  // Blocks a second payment starting before the first has re-rendered the button.
  const payingRef = useRef(false);
  const [pinOpen, setPinOpen] = useState(false);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // NUBAN lookups need the bank's code. The list is the one withdrawals use;
  // if it cannot load, the field falls back to typing the code.
  useEffect(() => {
    const token = session?.accessToken;
    if (!needsBank || banksState !== "idle" || !token) return;

    setBanksState("loading");
    fetch(`${API_URL}/wallet/banks`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((res) => res.json())
      .then((result) => {
        const list = Array.isArray(result?.data) ? result.data : [];
        setBanks(list.filter((bank: any) => bank?.code && bank?.name));
        setBanksState(list.length > 0 ? "loaded" : "failed");
      })
      .catch(() => setBanksState("failed"));
  }, [needsBank, banksState, session?.accessToken, API_URL]);

  // /services lists only active services, so KYC missing from it has been
  // deactivated by an admin. A finished transaction's result still shows.
  if (servicesLoaded && !services.some((s: { slug: string }) => s.slug === "kyc") && step !== 3) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-bold">KYC Verification is unavailable</h1>
        <p className="text-sm text-muted-foreground">This service is not available right now. Please check back soon.</p>
        <Button variant="outline" onClick={() => router.push("/account/services")}>See available services</Button>
      </div>
    );
  }

  const countryProducts = products.filter((p: any) => p.metadata?.country_name === selectedCountry);

  const balance = Number(wallet?.balance ?? 0);

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _cleared, ...rest } = prev;
      return rest;
    });
  };

  const onReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return toast.error("Please select a country");
    if (!selectedProduct) return toast.error("Please select a KYC product");

    // The same checks the server runs before charging, shown beside each field.
    const errors: Record<string, string> = {};
    for (const field of fields) {
      const error = kycFieldError(field, formValues[field.name]);
      if (error) errors[field.name] = error;
    }
    setFieldErrors(errors);

    const firstError = Object.values(errors)[0];
    if (firstError) return toast.error(firstError);

    setFormValues(Object.fromEntries(fields.map((field) => [field.name, cleanKycValue(field, formValues[field.name])])));
    setStep(2);
  };

  /** The details the lookup is sent, empty optional ones left out. */
  const lookupDetails = (): Record<string, string> =>
    Object.fromEntries(
      fields
        .map((field) => [field.name, cleanKycValue(field, formValues[field.name])] as const)
        .filter(([, value]) => value !== ""),
    );

  /** Build summary items for the ReviewAndPay component */
  const buildSummaryItems = (): OrderSummaryItem[] => {
    const items: OrderSummaryItem[] = [];
    items.push({ label: "Country", value: selectedCountry });
    items.push({ label: "Product", value: selectedProduct?.name ?? "" });

    for (const field of fields) {
      const value = formValues[field.name] ?? "";
      if (value.trim() === "") continue;
      items.push({ label: field.label, value: kycDisplayValue(field, value, banks) });
    }

    return items;
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
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(pollRef.current!);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/transactions/${reference}/status`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_ERRORS) {
            clearInterval(pollRef.current!);
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

  /**
   * A wallet payment first opens the PIN dialog, which calls back here with
   * the PIN. A PIN refusal is rethrown for the dialog to show.
   */
  const handlePay = async (pin?: string) => {
    const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);
    if (selectedGateway?.slug === 'wallet' && Number(selectedProduct.amount) > balance) {
      return toast.error("Insufficient wallet balance. Fund your wallet or select another payment method.");
    }
    if (selectedGateway?.slug === 'wallet' && !pin) {
      setPinOpen(true);
      return;
    }
    if (payingRef.current) return;
    payingRef.current = true;

    setSubmitting(true);
    setPaymentStatusLabel(null);
    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Session expired. Please log in again.");

      // ── Step 1: create the transaction on the backend ──────────────────────
      const payload: any = {
        bill_service_slug: "kyc",
        bill_provider_id: zeehProvider.id,
        bill_product_id: selectedProduct.id,
        // The server resets this from the details; sent because it is required.
        customer: kycCustomer(fields, formValues, selectedProduct.name ?? "Verification"),
        amount: Number(selectedProduct.amount),
        // The lookup to run comes from the product on the server, never from here.
        metadata: lookupDetails(),
        payment_gateway_id: selectedGateway?.slug === 'wallet' ? null : selectedGatewayId,
        transaction_pin: pin,
        idempotency_key: newIdempotencyKey(),
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
      assertPinAccepted(result);
      if (!res.ok) throw new Error(result.message || "Payment failed");

      // ── Step 2a: wallet pay — done immediately ─────────────────────────────
      if (selectedGateway?.slug === 'wallet') {
        setResultTxn(result.data || result);
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        setTxnStatus("processing");
        setStep(3);

        // Start polling for the actual bill delivery result
        if (token) {
          pollTransactionStatus(
            (result.data || result).reference,
            token as string,
            result.data || result,
          );
        }
        return;
      }

      // ── Step 2b: gateway pay — open inline modal ───────────────────────────
      const txnData = result.data;
      const { payment_url, access_code, reference } = txnData;

      setPaymentStatusLabel("Opening payment modal…");

      const userEmail = (session?.user as any)?.email ?? `user-${reference}@gapcastle.ng`;

      const gatewayResult = await openGatewayModal({
        gatewaySlug: selectedGateway!.slug,
        reference,
        accessCode: access_code ?? "",
        paymentUrl: payment_url ?? null,
        // What the gateway's checkout charges: the bill amount plus any gateway
        // charges (Flutterwave), from the server. Never displayed in the app.
        amount: Number(txnData.checkout_amount ?? txnData.total ?? selectedProduct.amount),
        email: userEmail,
        name: (session?.user as any)?.name ?? undefined,
        publicKey: selectedGateway!.public_key ?? "",
        sdkConfig: selectedGateway!.sdk_config ?? {},
        currency: "NGN",
      });

      // ── Step 3: handle modal result ────────────────────────────────────────
      if (gatewayResult.status === "cancelled") {
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
      setResultTxn({ ...txnData, ...verifyData?.data });
      setTxnStatus(verifiedStatus === "successful" ? "successful" : "processing");
      setSubmitting(false);
      setPaymentStatusLabel(null);
      setStep(3);

      if (verifiedStatus !== "successful") {
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        pollTransactionStatus(reference, token as string, txnData);
      } else {
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
      }

    } catch (error: any) {
      setSubmitting(false);
      setPaymentStatusLabel(null);
      if (error instanceof TransactionPinError) throw error;
      toast.error(error.message);
    } finally {
      payingRef.current = false;
    }
  };

  // ── Step 3: Receipt Screen ─────────────────────────────────────────────────
  if (step === 3 && resultTxn) {
    const isProcessing = txnStatus === "processing";
    const isFailed = txnStatus === "failed";
    const isSuccess = txnStatus === "successful";

    return (
      <div className="mx-auto max-w-md py-8 animate-in fade-in zoom-in duration-300">
        <div className="rounded-2xl border bg-card shadow-card relative overflow-hidden">

          {/* Colour band at top changes with status */}
          <div className={[
            "h-2 w-full",
            isProcessing ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 animate-pulse" : "",
            isSuccess ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "",
            isFailed ? "bg-destructive" : "",
          ].join(" ")} />

          <div className="p-6 sm:p-8 text-center">

            {/* Status icon */}
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

            {/* Headline */}
            {isProcessing && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight">Payment Received!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your payment was confirmed. We&apos;re now processing your KYC verification&#8202;—&#8202;this usually takes a few seconds.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Processing in background
                </div>
              </>
            )}
            {isSuccess && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight text-emerald-600">KYC Successful</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your identity verification was processed successfully.</p>
              </>
            )}
            {isFailed && (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight text-destructive">Verification Failed</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {txnErrorMessage ?? "We could not process your verification. Your wallet will be refunded automatically."}
                </p>
              </>
            )}

            {/* Receipt card */}
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5 text-left text-sm shadow-sm">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-border">
                  <span className="text-muted-foreground font-medium">Amount Paid</span>
                  <span className="text-2xl font-black">{formatNaira(activeTxn.amount ?? selectedProduct?.amount)}</span>
                </div>
                <div className="flex justify-between gap-4 py-1">
                  <span className="text-muted-foreground">Product</span>
                  <span className="text-right text-foreground font-semibold">{selectedProduct?.name}</span>
                </div>
                {activeTxn.customer && (
                  <div className="flex justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="text-right text-foreground font-medium">{activeTxn.receipt?.customer_name || activeTxn.customer}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-1">
                  <span className="text-muted-foreground">Country</span>
                  <span className="text-right text-foreground">{selectedCountry}</span>
                </div>
                <div className="flex justify-between gap-4 py-1">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded select-all">{activeTxn.reference}</span>
                </div>

                {/* Status badge */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground font-medium">Status</span>
                  {isProcessing && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />Processing</span>}
                  {isSuccess && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />Verified</span>}
                  {isFailed && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-destructive">Failed</span>}
                </div>
              </div>
            </div>

            {/* View Full Report button (only when successful and response data exists) */}
            {isSuccess && activeTxn.response && (
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

            {/* Actions */}
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
                    setFormValues({});
                    setResultTxn(null);
                    setSelectedProduct(null);
                    setTxnStatus("processing");
                  }}
                >
                  {isProcessing ? "Pay Another" : "Done"}
                </Button>
              )}
            </div>

            {/* Processing footnote */}
            {isProcessing && (
              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                This screen updates automatically. You can safely navigate away — we&apos;ll process your verification in the background and you can track progress in your transaction history.
              </p>
            )}
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

  /** The control for one field of the selected lookup, by its declared type. */
  const renderField = (field: KycField) => {
    const id = `kyc-${field.name}`;
    const value = formValues[field.name] ?? "";
    const invalid = Boolean(fieldErrors[field.name]);
    const inputClass = cn("h-11 rounded-xl bg-muted/50", invalid && "border-destructive");

    if (field.type === "image") {
      const busy = Boolean(uploading[field.name]);
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl bg-muted/50 border-dashed"
              onClick={() => setActiveCameraField(field.name)}
              disabled={busy}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <div className="relative flex-1">
              <Input
                id={id}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleFileUpload(field.name, e.target.files[0]);
                }}
                disabled={busy}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <Button type="button" variant="outline" className="w-full h-11 rounded-xl bg-muted/50 pointer-events-none" disabled={busy}>
                Upload Photo
              </Button>
            </div>
          </div>
          {busy && <p className="text-xs text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
          {value && !busy && (
            <div className="mt-2 relative rounded-xl overflow-hidden border border-emerald-200 bg-muted w-24 h-24 sm:w-32 sm:h-32 shadow-sm">
              <img src={value} alt={`${field.label} preview`} className="w-full h-full object-cover" />
              <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <NativeSelect id={id} value={value} onChange={(e) => handleInputChange(field.name, e.target.value)} className={cn("w-full", invalid && "border-destructive")}>
          <NativeSelectOption value="">Select {field.label.toLowerCase()}</NativeSelectOption>
          {field.options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>
          ))}
        </NativeSelect>
      );
    }

    if (field.type === "bank" && banksState !== "failed") {
      const selected = banks.find((bank) => bank.code === value);
      return (
        <Popover open={bankPickerOpen === field.name} onOpenChange={(open) => setBankPickerOpen(open ? field.name : null)}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={bankPickerOpen === field.name}
              className={cn("h-11 w-full justify-between rounded-xl bg-muted/50 font-normal", invalid && "border-destructive")}
              disabled={banksState !== "loaded"}
            >
              {banksState === "loaded" ? (selected?.name ?? "Select a bank") : "Loading banks..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search bank..." />
              <CommandList>
                <CommandEmpty>No bank found.</CommandEmpty>
                <CommandGroup>
                  {banks.map((bank) => (
                    <CommandItem key={bank.code} value={bank.name} onSelect={() => { handleInputChange(field.name, bank.code); setBankPickerOpen(null); }}>
                      <Check className={cn("mr-2 h-4 w-4", value === bank.code ? "opacity-100" : "opacity-0")} />
                      {bank.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    const numeric = field.type === "digits" || field.type === "phone" || field.type === "bank";
    return (
      <Input
        id={id}
        type={field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text"}
        inputMode={numeric ? "numeric" : undefined}
        autoCapitalize={field.transform === "upper" ? "characters" : undefined}
        max={field.type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
        maxLength={field.type === "phone" ? 14 : field.max ?? undefined}
        value={value}
        onChange={(e) => handleInputChange(field.name, field.type === "digits" ? e.target.value.replace(/\D/g, "") : e.target.value)}
        placeholder={field.placeholder ?? (field.type === "bank" ? "Bank code, e.g. 058" : `Enter ${field.label.toLowerCase()}`)}
        aria-invalid={invalid}
        className={inputClass}
      />
    );
  };

  // ── Steps 1 & 2 ───────────────────────────────────────────────────────────
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
              <h1 className="text-lg font-bold leading-none tracking-tight sm:text-xl">KYC Verification</h1>
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
            <form onSubmit={onReview} className="space-y-6 animate-in fade-in duration-300">
              {/* Country Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">1. Select Country</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {countries.map(country => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => { setSelectedCountry(country); setSelectedProduct(null); setFormValues({}); setFieldErrors({}); }}
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
                        setFieldErrors({});
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
                    {fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label htmlFor={`kyc-${field.name}`} className="text-sm font-medium">
                          {field.label}
                          {!field.required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
                        </Label>
                        {renderField(field)}
                        {fieldErrors[field.name] ? (
                          <p className="text-xs text-destructive">{fieldErrors[field.name]}</p>
                        ) : field.hint ? (
                          <p className="text-xs text-muted-foreground">{field.hint}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={!selectedCountry || !selectedProduct} className="w-full h-12 text-base font-semibold" size="lg">
                Continue to Review
              </Button>
            </form>
          )}

          {step === 2 && selectedProduct && (
            <ReviewAndPay
              title="KYC Verification"
              items={buildSummaryItems()}
              amount={Number(selectedProduct.amount)}
              quote={priceQuote}
              quoteLoading={quoteLoading}
              quoteError={quoteError ? quoteError.message : null}
              balance={balance}
              gateways={gateways}
              selectedGatewayId={selectedGatewayId}
              onSelectGateway={setSelectedGatewayId}
              onEdit={() => setStep(1)}
              onPay={() => handlePay()}
              submitting={submitting}
              paymentStatusLabel={paymentStatusLabel}
            />
          )}
        </div>
      </div>

      <TransactionPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Confirm payment"
        description="Enter your 4-digit PIN to pay from your wallet."
        onConfirm={(pin) => handlePay(pin)}
      />

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
