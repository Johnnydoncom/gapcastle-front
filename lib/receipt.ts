import { formatNaira } from "@/lib/format";
import { formatTokenDisplay, getDeliveryDisplayInfo } from "@/lib/delivery-display";

/**
 * Printable receipt.
 *
 * Built from the transaction data rather than copied out of the dialog: the
 * dialog is styled with Tailwind classes that do not exist in a print
 * document, which is why the old printout came out unformatted.
 *
 * Laid out like a utility bill (biller, customer name, service address,
 * account number, amount, date) because customers present it as proof of
 * address. The name and address in `receipt` come from the biller's own
 * record via the API — never from what the user typed.
 */

interface AccountHolder {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ReceiptTransaction {
  reference: string;
  status?: string;
  type?: string;
  description?: string;
  provider_name?: string;
  provider_reference?: string | null;
  customer?: string;
  amount: number | string;
  fee?: number | string;
  total?: number | string;
  cashback?: number | string;
  created_at: string;
  service_group?: string | null;
  bill_service?: { name?: string } | null;
  token?: string | string[] | null;
  receipt?: {
    customer_name?: string | null;
    customer_address?: string | null;
    account_number?: string | null;
    meter_type?: string | null;
    delivery_phone?: string | null;
    units?: string | null;
    tariff?: string | null;
    plan?: string | null;
    completed_at?: string | null;
    account_holder?: AccountHolder | null;
  };
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatReceiptDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
  });
};

/** Rows with an empty value are dropped so the receipt never shows blank labels. */
const rows = (items: [string, unknown, { mono?: boolean; strong?: boolean }?][]): string =>
  items
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([label, value, opts]) => `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td class="${opts?.mono ? "mono" : ""} ${opts?.strong ? "strong" : ""}">${escapeHtml(value)}</td>
      </tr>`)
    .join("");

const STATUS_LABELS: Record<string, string> = {
  successful: "PAID",
  failed: "FAILED",
  processing: "PROCESSING",
  pending: "PENDING",
  pending_payment: "AWAITING PAYMENT",
};

export function buildReceiptHtml(txn: ReceiptTransaction, fallbackHolder?: AccountHolder): string {
  const r = txn.receipt ?? {};
  const holder = r.account_holder ?? fallbackHolder ?? {};
  const status = (txn.status ?? "pending").toLowerCase();
  const serviceName = txn.bill_service?.name ?? txn.description ?? "Bill Payment";
  const biller = txn.provider_name && txn.provider_name !== "Unknown Provider" ? txn.provider_name : null;
  const fee = Number(txn.fee ?? 0);
  const total = Number(txn.total ?? 0) > 0 ? txn.total : txn.amount;
  const cashback = Number(txn.cashback ?? 0);

  const tokenValue = txn.token
    ? formatTokenDisplay(txn.token, txn.service_group ?? null)
    : null;
  const tokenLabel = getDeliveryDisplayInfo(txn.service_group ?? null).label;

  const hasVerifiedCustomer = Boolean(r.customer_name || r.customer_address);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>GapCastle-Receipt-${escapeHtml(txn.reference)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827; background: #fff; font-size: 12.5px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 760px; margin: 0 auto; padding: 28px 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 3px solid #14248F; }
  .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #14248F; }
  .brand-sub { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .doc { text-align: right; }
  .doc h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 1.5px; color: #111827; }
  .doc p { font-size: 11px; color: #6B7280; }
  .doc .mono { color: #111827; }
  .stamp {
    display: inline-block; margin-top: 8px; padding: 3px 12px; border: 2px solid; border-radius: 4px;
    font-size: 11px; font-weight: 800; letter-spacing: 2px;
  }
  .stamp.successful { color: #047857; border-color: #047857; }
  .stamp.failed { color: #B91C1C; border-color: #B91C1C; }
  .stamp.processing, .stamp.pending, .stamp.pending_payment { color: #B45309; border-color: #B45309; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
  .box { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
  .box h2 {
    font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.2px; color: #fff;
    background: #14248F; padding: 7px 12px;
  }
  .box.muted h2 { background: #374151; }
  .box .body { padding: 10px 12px; }
  .name { font-size: 14px; font-weight: 700; }
  .address { margin-top: 4px; white-space: pre-line; }
  .meta { margin-top: 8px; color: #4B5563; font-size: 11.5px; }
  .meta span { display: block; }
  .note { font-size: 10.5px; color: #6B7280; margin-top: 8px; font-style: italic; }
  section { margin-top: 20px; }
  section > h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #14248F; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #F0F1F3; vertical-align: top; }
  th { width: 38%; font-weight: 500; color: #6B7280; }
  td { font-weight: 600; word-break: break-word; }
  td.mono, .mono { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 11.5px; }
  tr.total th, tr.total td { border-top: 2px solid #111827; border-bottom: none; font-size: 14px; color: #111827; font-weight: 800; }
  .token { margin-top: 10px; border: 2px dashed #14248F; border-radius: 8px; padding: 12px; text-align: center; background: #F5F7FF; }
  .token .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #14248F; font-weight: 700; }
  .token .value { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 17px; font-weight: 800; letter-spacing: 2px; margin-top: 4px; white-space: pre-line; }
  footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #E5E7EB; font-size: 10.5px; color: #6B7280; text-align: center; }
  footer strong { color: #374151; }
  @media (max-width: 560px) { .parties { grid-template-columns: 1fr; } .sheet { padding: 16px; } }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <div>
      <div class="brand">GapCastle</div>
      <div class="brand-sub">Bills &amp; Utility Payments</div>
    </div>
    <div class="doc">
      <h1>Payment Receipt</h1>
      <p>Receipt No: <span class="mono">${escapeHtml(txn.reference)}</span></p>
      <p>Date: ${escapeHtml(formatReceiptDate(r.completed_at ?? txn.created_at))}</p>
      <span class="stamp ${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] ?? status.toUpperCase())}</span>
    </div>
  </header>

  <div class="parties">
    <div class="box">
      <h2>Billed Customer</h2>
      <div class="body">
        ${r.customer_name ? `<div class="name">${escapeHtml(r.customer_name)}</div>` : ""}
        ${r.customer_address ? `<div class="address">${escapeHtml(r.customer_address)}</div>` : ""}
        <div class="meta">
          ${r.account_number || txn.customer ? `<span>Account / Meter No: <b class="mono">${escapeHtml(r.account_number || txn.customer)}</b></span>` : ""}
          ${r.meter_type ? `<span>Meter Type: <b>${escapeHtml(r.meter_type)}</b></span>` : ""}
          ${biller ? `<span>Biller: <b>${escapeHtml(biller)}</b></span>` : ""}
        </div>
        ${hasVerifiedCustomer && biller ? `<p class="note">Name and service address as registered with ${escapeHtml(biller)}.</p>` : ""}
      </div>
    </div>
    <div class="box muted">
      <h2>Paid By</h2>
      <div class="body">
        <div class="name">${escapeHtml(holder.name || "—")}</div>
        <div class="meta">
          ${holder.email ? `<span>Email: <b>${escapeHtml(holder.email)}</b></span>` : ""}
          ${holder.phone ? `<span>Phone: <b class="mono">${escapeHtml(holder.phone)}</b></span>` : ""}
          ${r.delivery_phone ? `<span>Notification Phone: <b class="mono">${escapeHtml(r.delivery_phone)}</b></span>` : ""}
        </div>
      </div>
    </div>
  </div>

  <section>
    <h3>Service Details</h3>
    <table>
      ${rows([
        ["Service", serviceName],
        ["Biller / Provider", biller],
        ["Plan / Product", r.plan],
        ["Units", r.units],
        ["Tariff", r.tariff],
        ["Provider Reference", txn.provider_reference, { mono: true }],
      ])}
    </table>
    ${tokenValue ? `
    <div class="token">
      <div class="label">${escapeHtml(tokenLabel)}</div>
      <div class="value">${escapeHtml(tokenValue)}</div>
    </div>` : ""}
  </section>

  <section>
    <h3>Payment Summary</h3>
    <table>
      ${rows([
        ["Amount", formatNaira(txn.amount)],
        ["Convenience Fee", fee > 0 ? formatNaira(fee) : null],
        ["Cashback Earned", cashback > 0 ? formatNaira(cashback) : null],
        ["Transaction Reference", txn.reference, { mono: true }],
      ])}
      <tr class="total"><th>Total Paid</th><td>${escapeHtml(formatNaira(total))}</td></tr>
    </table>
  </section>

  <footer>
    <p><strong>This is an electronically generated receipt and is valid without a signature.</strong></p>
    <p>Verify this payment with reference ${escapeHtml(txn.reference)} on GapCastle.</p>
    <p>Printed ${escapeHtml(formatReceiptDate(new Date().toISOString()))}</p>
  </footer>
</div>
</body>
</html>`;
}

/**
 * Print the receipt from a hidden iframe so popup blockers cannot stop it.
 * The document title becomes the default file name for "Save as PDF".
 */
export function printReceipt(txn: ReceiptTransaction, fallbackHolder?: AccountHolder): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(buildReceiptHtml(txn, fallbackHolder));
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });

  // Give the iframe a tick to lay out before opening the print dialog.
  setTimeout(() => {
    win.focus();
    win.print();
    // Browsers without afterprint support still get cleaned up.
    setTimeout(cleanup, 60_000);
  }, 100);
}
