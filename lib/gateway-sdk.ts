/**
 * Gateway SDK loader + modal launcher.
 *
 * Each gateway injects its own `<script>` tag on first use (lazy-loaded so the
 * SDKs are never downloaded on wallet-pay flows where they are not needed).
 *
 * Exported: `openGatewayModal(params)` — returns a Promise that resolves when
 * the user completes payment, or rejects when they cancel / an error occurs.
 */

export interface GatewayModalParams {
  /** Gateway slug from the backend (paystack | flutterwave | monnify) */
  gatewaySlug: string;
  /** The transaction reference returned by POST /transactions/purchase */
  reference: string;
  /** Access code / token returned by POST /transactions/purchase */
  accessCode: string;
  /** Payment URL (redirect fallback) */
  paymentUrl: string | null;
  /** Amount in Naira (not kobo) */
  amount: number;
  /** User's email */
  email: string;
  /** User's full name */
  name?: string;
  /** Public key sourced from the backend gateway object (gateway.public_key) */
  publicKey: string;
  /** Currency code — almost always NGN */
  currency?: string;
  /**
   * Gateway-specific SDK config sourced from the backend (gateway.sdk_config).
   * Contains only safe, non-secret fields (e.g. contract_code for Monnify).
   */
  sdkConfig?: Record<string, string>;
}

export type GatewayResult =
  | { status: "success"; reference: string }
  | { status: "cancelled" }
  | { status: "error"; message: string };

// ─── Script loader (idempotent) ───────────────────────────────────────────────

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// ─── Gateway launchers ────────────────────────────────────────────────────────

async function openPaystack(params: GatewayModalParams): Promise<GatewayResult> {
  await loadScript("https://js.paystack.co/v1/inline.js", "paystack-inline-js");

  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) throw new Error("Paystack SDK failed to initialise.");

  return new Promise<GatewayResult>((resolve) => {
    const handler = PaystackPop.newTransaction({
      key: params.publicKey,
      email: params.email,
      amount: Math.round(params.amount * 100), // convert to kobo
      ref: params.reference,
      currency: params.currency ?? "NGN",
      onSuccess: (transaction: { reference: string }) => {
        resolve({ status: "success", reference: transaction.reference });
      },
      onCancel: () => {
        resolve({ status: "cancelled" });
      },
    });
    // handler.openIframe() is called automatically by newTransaction
    void handler;
  });
}

async function openFlutterwave(params: GatewayModalParams): Promise<GatewayResult> {
  await loadScript(
    "https://checkout.flutterwave.com/v3.js",
    "flutterwave-inline-js"
  );

  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  if (!FlutterwaveCheckout) throw new Error("Flutterwave SDK failed to initialise.");

  return new Promise<GatewayResult>((resolve) => {
    const modal = FlutterwaveCheckout({
      public_key: params.publicKey,
      tx_ref: params.reference,
      amount: params.amount,
      currency: params.currency ?? "NGN",
      customer: {
        email: params.email,
        name: params.name ?? params.email,
      },
      customizations: {
        title: "Gapcastle",
        description: "Bill payment",
        logo: `${window.location.origin}/logo.png`,
      },
      callback: (response: { status: string; tx_ref: string }) => {
        // Flutterwave v3 does not close the modal automatically on success
        if (modal && typeof modal.close === 'function') {
          modal.close();
        }
        
        if (response.status === "successful" || response.status === "completed") {
          resolve({ status: "success", reference: response.tx_ref });
        } else {
          resolve({ status: "cancelled" });
        }
      },
      onclose: () => {
        // onclose fires AFTER callback when payment succeeds; the promise is
        // already resolved at that point so this second call is a no-op.
        resolve({ status: "cancelled" });
      },
    });
  });
}

async function openMonnify(params: GatewayModalParams): Promise<GatewayResult> {
  await loadScript(
    "https://sdk.monnify.com/plugin/monnify.js",
    "monnify-inline-js"
  );

  const MonnifySDK = (window as any).MonnifySDK;
  if (!MonnifySDK) throw new Error("Monnify SDK failed to initialise.");

  return new Promise<GatewayResult>((resolve) => {
    MonnifySDK.initialize({
      amount: params.amount,
      currency: params.currency ?? "NGN",
      reference: params.reference,
      customerFullName: params.name ?? params.email,
      customerEmail: params.email,
      apiKey: params.publicKey,
      contractCode: params.sdkConfig?.contract_code ?? "",
      paymentDescription: "Bill Payment",
      isTestMode: params.publicKey.toUpperCase().includes("TEST"),
      onComplete: (response: { paymentStatus: string; transactionReference: string }) => {
        if (response.paymentStatus === "PAID") {
          resolve({ status: "success", reference: response.transactionReference });
        } else {
          resolve({ status: "cancelled" });
        }
      },
      onClose: (data: unknown) => {
        // Fires when the modal is dismissed — only resolve if not already done.
        resolve({ status: "cancelled" });
        void data;
      },
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Open the appropriate inline payment modal for a gateway.
 *
 * Falls back to `window.location.href` when:
 *   - the gateway slug is unrecognised
 *   - the SDK script fails to load (JS error)
 *   - `payment_url` is the only option available
 *
 * @throws never — errors are converted to `{ status: "error" }` or redirects.
 */
export async function openGatewayModal(
  params: GatewayModalParams
): Promise<GatewayResult> {
  try {
    switch (params.gatewaySlug) {
      case "paystack":
        return await openPaystack(params);
      case "flutterwave":
        return await openFlutterwave(params);
      case "monnify":
        return await openMonnify(params);
      default:
        // Unknown gateway — redirect if we have a URL.
        if (params.paymentUrl) {
          window.location.href = params.paymentUrl;
          return { status: "cancelled" }; // will navigate away anyway
        }
        return { status: "error", message: `Unsupported gateway: ${params.gatewaySlug}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GatewaySDK] Modal error:", message);

    // JS failure — fall back to redirect if available.
    if (params.paymentUrl) {
      console.warn("[GatewaySDK] Falling back to redirect for", params.gatewaySlug);
      window.location.href = params.paymentUrl;
      return { status: "cancelled" };
    }

    return { status: "error", message };
  }
}
