"use client";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTransactions } from "@/hooks/useGapcastle";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatNaira, formatDate } from "@/lib/format";
import {
  Search, Download, Printer, Share2, X, Copy, Check,
  ArrowDownLeft, ArrowUpRight, ReceiptText, Clock, CheckCircle2,
  XCircle, Loader2, FileText, ChevronRight, Eye,
  Zap, GraduationCap, Tv, Smartphone, ShieldCheck, Globe, Droplets, Flame, KeyRound,
} from "lucide-react";
import { useTransactionDetail } from "@/hooks/useGapcastle";
import { TransactionReport } from "@/components/TransactionReport";
import { getDeliveryDisplayInfo, getDeliveryColorClasses, formatTokenDisplay } from "@/lib/delivery-display";

const deliveryIcons = { Zap, GraduationCap, Tv, Smartphone, ShieldCheck, Globe, Droplets, Flame, KeyRound } as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

// ─── Status helpers ───────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  successful: {
    label: "Successful",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  processing: {
    label: "Processing",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  pending: {
    label: "Pending",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status?.toLowerCase()] ?? statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TxnIcon({ type }: { type: string }) {
  const isCredit = type === "wallet_funding" || type === "cashback";
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCredit ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
      {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
    </div>
  );
}

// ─── Receipt Row ──────────────────────────────────────────────
function ReceiptRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={`text-[13px] font-medium text-right max-w-[60%] break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function Transactions() {
  const { data: session } = useSession();
  const { data: txns = [], isLoading } = useTransactions();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch detailed transaction when a transaction is selected
  const { data: txnDetail, isLoading: isLoadingDetail } = useTransactionDetail(selectedTxn?.reference || null);

  const activeTxn = txnDetail || selectedTxn;

  const filtered = txns.filter((t: any) => {
    if (type !== "all" && t.type !== type) return false;
    if (q && !`${t.description ?? ""} ${t.provider_name ?? ""} ${t.reference}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  // ─── Download Report (PDF from backend) ─────────────────────
  const downloadReport = useCallback(async (txId: number, ref: string) => {
    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/transactions/${txId}/download-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${ref}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // alert("Error downloading report.");
    }
  }, [session]);

  // ─── Print Receipt ──────────────────────────────────────────
  const printReceipt = useCallback(() => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank", "width=420,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Transaction Receipt</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;color:#1a1a1a;max-width:420px;margin:0 auto}
        .logo{text-align:center;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
        .subtitle{text-align:center;font-size:11px;color:#888;margin-bottom:24px}
        .status{text-align:center;padding:12px;border-radius:12px;font-size:13px;font-weight:600;margin-bottom:20px}
        .status.successful{background:#ecfdf5;color:#059669}
        .status.failed{background:#fef2f2;color:#ef4444}
        .status.processing{background:#fffbeb;color:#d97706}
        .status.pending{background:#f0f9ff;color:#0284c7}
        .amount{text-align:center;font-size:32px;font-weight:800;margin:16px 0 24px}
        .divider{border:none;border-top:1.5px dashed #e5e7eb;margin:16px 0}
        .row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px}
        .row .label{color:#888}
        .row .value{font-weight:500;text-align:right;max-width:55%;word-break:break-all}
        .mono{font-family:'SF Mono',Monaco,monospace;font-size:11px}
        .footer{text-align:center;margin-top:28px;font-size:10px;color:#aaa;line-height:1.6}
        @media print{body{padding:16px}}
      </style></head><body>
        <div class="logo">GapCastle</div>
        <div class="subtitle">Transaction Receipt</div>
        ${receiptRef.current.innerHTML}
        <div class="footer">
          This is an electronic receipt generated by GapCastle.<br/>
          ${new Date().toLocaleString("en-NG")}
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  // ─── Share Receipt ──────────────────────────────────────────
  const shareReceipt = useCallback(async () => {
    if (!activeTxn) return;
    const text = [
      `GapCastle Receipt`,
      `──────────────`,
      `Amount: ${formatNaira(activeTxn.amount)}`,
      `Status: ${activeTxn.status}`,
      activeTxn.description && `Service: ${activeTxn.description}`,
      activeTxn.provider_name && `Provider: ${activeTxn.provider_name}`,
      activeTxn.customer && `Customer: ${activeTxn.customer}`,
      `Reference: ${activeTxn.reference}`,
      `Date: ${formatDate(activeTxn.created_at)}`,
      `──────────────`,
      `Powered by GapCastle`,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Transaction Receipt", text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeTxn]);

  // ─── Copy Reference ────────────────────────────────────────
  const copyRef = useCallback(async (ref: string) => {
    await navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ─── Summary Stats ─────────────────────────────────────────
  const totalSpent = txns.filter((t: any) => t.type === "bill_payment" && t.status === "successful").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const totalCashback = txns.filter((t: any) => t.status === "successful").reduce((s: number, t: any) => s + Number(t.cashback || 0), 0);
  const successCount = txns.filter((t: any) => t.status === "successful").length;

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        {/* ─── Header ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Transactions</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your complete payment history.</p>
          </div>
        </div>

        {/* ─── Filters ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="txn-search"
              placeholder="Search by reference, provider, description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 rounded-xl pl-10 bg-card border shadow-sm"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="txn-type-filter" className="h-11 rounded-xl sm:w-52 bg-card border shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All transactions</SelectItem>
              <SelectItem value="bill_payment">Bill payments</SelectItem>
              <SelectItem value="wallet_funding">Wallet funding</SelectItem>
              <SelectItem value="cashback">Cashback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ─── Transaction List ──────────────────────────────── */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-sm text-muted-foreground">Loading transactions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <ReceiptText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground/70">
                {q ? "Try a different search term." : "Your transactions will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((t: any, i: number) => {
                const isCredit = t.type === "wallet_funding" || t.type === "cashback";
                return (
                  <button
                    key={t.id}
                    id={`txn-row-${t.id}`}
                    onClick={() => setSelectedTxn(t)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus:outline-none focus:bg-muted/40 group"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TxnIcon type={t.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{t.description || t.provider_name || t.type}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-[15px] font-bold tabular-nums ${isCredit ? "text-emerald-600" : ""}`}>
                          {isCredit ? "+" : "−"}{formatNaira(t.amount)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Transaction Detail / Receipt Dialog ───────────── */}
      <Dialog open={!!selectedTxn && !showReport} onOpenChange={(open) => !open && setSelectedTxn(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle>&nbsp;</DialogTitle>
          {activeTxn && (() => {
            const isCredit = activeTxn.type === "wallet_funding" || activeTxn.type === "cashback";
            const cfg = statusConfig[activeTxn.status?.toLowerCase()] ?? statusConfig.pending;
            return (
              <>
                {/* Header gradient */}
                <div className={`px-6 pt-7 pb-5 text-center ${activeTxn.status === "successful" ? "bg-gradient-to-b from-emerald-500/10 to-transparent" :
                  activeTxn.status === "failed" ? "bg-gradient-to-b from-red-500/10 to-transparent" :
                    "bg-gradient-to-b from-primary/5 to-transparent"
                  }`}>
                  <DialogHeader>
                    <DialogTitle className="sr-only">Transaction Receipt</DialogTitle>
                    <DialogDescription className="sr-only">Details for transaction {activeTxn.reference}</DialogDescription>
                  </DialogHeader>
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3 ${activeTxn.status === "successful" ? "bg-emerald-500/15 text-emerald-600" :
                    activeTxn.status === "failed" ? "bg-red-500/15 text-red-500" :
                      "bg-primary/15 text-primary"
                    }`}>
                    {activeTxn.status === "successful" ? <CheckCircle2 className="h-7 w-7" /> :
                      activeTxn.status === "failed" ? <XCircle className="h-7 w-7" /> :
                        <Clock className="h-7 w-7" />}
                  </div>
                  <StatusBadge status={activeTxn.status} />
                  <p className={`mt-4 text-3xl font-extrabold tracking-tight ${isCredit ? "text-emerald-600" : ""}`}>
                    {isCredit ? "+" : "−"}{formatNaira(activeTxn.amount)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(activeTxn.created_at)}</p>
                </div>

                {/* Receipt body (printable) */}
                <div ref={receiptRef} className="px-6">
                  <Separator className="mb-1" />
                  <div className="divide-y divide-dashed divide-border/60">
                    {activeTxn.description && (
                      <ReceiptRow label="Service" value={activeTxn.description} />
                    )}
                    {activeTxn.provider_name && (
                      <ReceiptRow label="Provider" value={activeTxn.provider_name} />
                    )}
                    {activeTxn.customer && (
                      <ReceiptRow label="Customer" value={activeTxn.customer} />
                    )}
                    <ReceiptRow label="Amount" value={formatNaira(activeTxn.amount)} />
                    {Number(activeTxn.fee) > 0 && (
                      <ReceiptRow label="Fee" value={formatNaira(activeTxn.fee)} />
                    )}
                    {Number(activeTxn.total) > 0 && Number(activeTxn.fee) > 0 && (
                      <ReceiptRow label="Total" value={<span className="font-bold">{formatNaira(activeTxn.total)}</span>} />
                    )}
                    {Number(activeTxn.cashback) > 0 && (
                      <ReceiptRow label="Cashback" value={<span className="text-emerald-600 font-semibold">+{formatNaira(activeTxn.cashback)}</span>} />
                    )}
                    <ReceiptRow label="Reference" value={
                      <button
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 hover:bg-muted/80 transition-colors"
                        onClick={() => copyRef(activeTxn.reference)}
                      >
                        <span className="font-mono text-[11px]">{activeTxn.reference}</span>
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                      </button>
                    } />
                    <ReceiptRow label="Date" value={formatDate(activeTxn.created_at)} />

                    {/* ── Service-aware delivery result ── */}
                    {activeTxn.token && (() => {
                      const serviceGroup = activeTxn.service_group ?? null;
                      const deliveryInfo = getDeliveryDisplayInfo(serviceGroup);
                      const colorClasses = getDeliveryColorClasses(deliveryInfo.color);
                      const DeliveryIcon = deliveryIcons[deliveryInfo.icon];
                      const formattedToken = formatTokenDisplay(activeTxn.token, serviceGroup);

                      return (
                        <div className={`mt-3 mb-1 rounded-xl border-2 ${colorClasses.border} ${colorClasses.borderDark} ${colorClasses.bg} ${colorClasses.bgDark} p-5 text-center relative overflow-hidden`}>
                          {/* Decorative top accent */}
                          <div className={`absolute inset-x-0 top-0 h-1 ${colorClasses.bg === 'bg-amber-50' ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400' : colorClasses.bg === 'bg-emerald-50' ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400' : colorClasses.bg === 'bg-blue-50' ? 'bg-gradient-to-r from-blue-400 via-sky-400 to-blue-400' : colorClasses.bg === 'bg-violet-50' ? 'bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400' : colorClasses.bg === 'bg-sky-50' ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-sky-400' : colorClasses.bg === 'bg-cyan-50' ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400' : 'bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400'}`} />

                          {/* Icon + Label */}
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorClasses.iconBg} ${colorClasses.iconBgDark}`}>
                              <DeliveryIcon className={`h-4 w-4 ${colorClasses.text} ${colorClasses.textDark}`} />
                            </div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest ${colorClasses.text} ${colorClasses.textDark}`}>
                              {deliveryInfo.label}
                            </p>
                          </div>

                          {/* Token / PIN value */}
                          <p className={`text-lg font-mono font-black tracking-[0.18em] leading-relaxed ${colorClasses.text} ${colorClasses.textDark} select-all break-all`}>
                            {formattedToken}
                          </p>

                          {/* Hint text */}
                          <p className={`mt-2 text-[10px] ${colorClasses.textMuted} font-medium`}>
                            {deliveryInfo.hint}
                          </p>

                          {/* Copy button */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeTxn.token);
                              setTokenCopied(true);
                              setTimeout(() => setTokenCopied(false), 2500);
                            }}
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${tokenCopied
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : `${colorClasses.iconBg} ${colorClasses.iconBgDark} ${colorClasses.text} ${colorClasses.textDark} hover:opacity-80`
                            }`}
                          >
                            {tokenCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {tokenCopied ? "Copied!" : "Copy code"}
                          </button>
                        </div>
                      );
                    })()}
                    <div className={`status ${activeTxn.status?.toLowerCase()}`} style={{ display: "none" }}>
                      {cfg.label}
                    </div>
                    <div className="amount" style={{ display: "none" }}>
                      {isCredit ? "+" : "−"}{formatNaira(activeTxn.amount)}
                    </div>
                    {/* Hidden rows for print receipt template */}
                    <div style={{ display: "none" }}>
                      <div className="row"><span className="label">Service</span><span className="value">{activeTxn.description}</span></div>
                      <div className="row"><span className="label">Provider</span><span className="value">{activeTxn.provider_name}</span></div>
                      <div className="row"><span className="label">Customer</span><span className="value">{activeTxn.customer}</span></div>
                      <div className="row"><span className="label">Amount</span><span className="value">{formatNaira(activeTxn.amount)}</span></div>
                      <div className="row"><span className="label">Reference</span><span className="value mono">{activeTxn.reference}</span></div>
                      <div className="row"><span className="label">Date</span><span className="value">{formatDate(activeTxn.created_at)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 pt-3">
                  <Separator className="mb-4" />

                  {/* View Full Report Button (for successful KYC) */}
                  {activeTxn.service_group === "kyc" && activeTxn.status === "successful" && activeTxn.response && (
                    <Button
                      className="w-full mb-3 h-11 rounded-xl text-sm font-semibold bg-primary text-primary-foreground"
                      onClick={() => setShowReport(true)}
                      disabled={isLoadingDetail}
                    >
                      {isLoadingDetail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                      View Full Report
                    </Button>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      id="btn-share-receipt"
                      variant="outline"
                      className="h-11 rounded-xl text-xs font-semibold"
                      onClick={shareReceipt}
                    >
                      {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-500" /> : <Share2 className="mr-1.5 h-4 w-4" />}
                      {copied ? "Copied" : "Share"}
                    </Button>
                    <Button
                      id="btn-print-receipt"
                      variant="outline"
                      className="h-11 rounded-xl text-xs font-semibold"
                      onClick={printReceipt}
                    >
                      <Printer className="mr-1.5 h-4 w-4" />
                      Print
                    </Button>
                    {activeTxn.has_report ? (
                      <Button
                        id="btn-download-report"
                        className="h-11 rounded-xl text-xs font-semibold"
                        onClick={() => downloadReport(activeTxn.id, activeTxn.reference)}
                      >
                        <FileText className="mr-1.5 h-4 w-4" />
                        Report
                      </Button>
                    ) : (
                      <Button
                        id="btn-download-receipt"
                        variant="outline"
                        className="h-11 rounded-xl text-xs font-semibold"
                        onClick={printReceipt}
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Detailed Report Dialog ───────────── */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
          <DialogTitle>&nbsp;</DialogTitle>
          {activeTxn && (
            <TransactionReport transaction={activeTxn} onClose={() => setShowReport(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
