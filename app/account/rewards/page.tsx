"use client";
import { useState } from "react";
import {
  useRewardsSummary, useRewardHistory, useReferrals, useWithdrawCashback,
  type PaginationMeta, type RewardEntry, type RewardType,
} from "@/hooks/useGapcastle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatNaira, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { TransactionPinDialog } from "@/components/TransactionPinDialog";
import { TransactionPinError } from "@/lib/transaction-pin";
import {
  Gift, Copy, Check, Loader2, Share2, Users, UserPlus, Wallet, ArrowRightLeft,
  Coins, ChevronLeft, ChevronRight, History, BadgeCheck, Clock, Link2, PauseCircle,
} from "lucide-react";

const historyFilters: { value: "all" | RewardType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cashback", label: "Cashback" },
  { value: "referral", label: "Referrals" },
  { value: "withdrawal", label: "Withdrawals" },
];

const entryStyles: Record<RewardType, { icon: typeof Coins; className: string }> = {
  cashback: { icon: Coins, className: "bg-success/10 text-success" },
  referral: { icon: UserPlus, className: "bg-primary/10 text-primary" },
  withdrawal: { icon: ArrowRightLeft, className: "bg-amber-500/10 text-amber-600" },
};

// ─── Shared bits ──────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return { copied, copy };
}

function Pager({ meta, onPage, noun }: { meta?: PaginationMeta; onPage: (page: number) => void; noun: string }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-xs text-muted-foreground">
        Page {meta.current_page} of {meta.last_page} · {meta.total} {noun}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RowSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Gift; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// ─── Move to wallet ───────────────────────────────────────────
function WithdrawDialog({ open, onOpenChange, balance }: { open: boolean; onOpenChange: (open: boolean) => void; balance: number }) {
  const withdraw = useWithdrawCashback();
  // Remounted on each open (see `key` below), so it starts at the full balance.
  const [amount, setAmount] = useState(balance >= 1 ? balance.toFixed(2) : "");
  const [pinOpen, setPinOpen] = useState(false);

  const value = Number(amount);
  const error =
    amount === "" ? null
      : !Number.isFinite(value) || value < 1 ? "Enter at least ₦1.00"
        : value > balance ? "That is more than your rewards balance"
          : !/^\d+(\.\d{1,2})?$/.test(amount) ? "Use at most 2 decimal places"
            : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === "" || error) return;
    setPinOpen(true);
  };

  /** A PIN refusal is rethrown for the dialog to show. */
  const moveToWallet = async (pin: string) => {
    try {
      await withdraw.mutateAsync({ amount: value, pin });
      toast.success(`${formatNaira(value)} moved to your wallet`);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof TransactionPinError) throw err;
      toast.error((err as Error).message || "Could not move your rewards. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Move rewards to wallet</DialogTitle>
            <DialogDescription>
              Funds arrive in your main wallet instantly and can be spent on any bill.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reward-amount">Amount (₦)</Label>
              <span className="text-xs text-muted-foreground">Available: {formatNaira(balance)}</span>
            </div>
            <div className="flex gap-2">
              <Input
                id="reward-amount"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
                aria-invalid={!!error}
                className="text-lg font-semibold"
              />
              <Button type="button" variant="outline" onClick={() => setAmount(balance.toFixed(2))}>Max</Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={withdraw.isPending || amount === "" || !!error}>
              {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move {amount && !error ? formatNaira(value) : "funds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <TransactionPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Confirm transfer"
        description={`${formatNaira(value)} will move from your rewards to your wallet.`}
        onConfirm={moveToWallet}
      />
    </Dialog>
  );
}

// ─── Refer & earn ─────────────────────────────────────────────
function ReferralCard() {
  const { data: summary, isLoading } = useRewardsSummary();
  const { copied, copy } = useCopy();

  if (isLoading || !summary) {
    return <div className="rounded-2xl border bg-card p-6 shadow-card"><RowSkeletons count={3} /></div>;
  }

  const { referral, program } = summary;
  // The page's own origin is always the right signup host. Summary data only
  // exists client-side, so reading window here cannot cause a hydration mismatch.
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(referral.code)}`
    : referral.link;
  const isActive = program.enabled && program.reward_amount > 0;
  const shareText = isActive
    ? `Pay your bills on GapCastle and earn cashback on every payment. Sign up with my code ${referral.code}:`
    : `Pay your bills on GapCastle. Sign up with my code ${referral.code}:`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on GapCastle", text: shareText, url: link });
      } catch {
        // Dismissing the share sheet is not an error.
      }
      return;
    }
    copy(`${shareText} ${link}`, "Invite message");
  };

  const steps = [
    { icon: Share2, text: "Share your link or code" },
    { icon: UserPlus, text: "Your friend signs up with it" },
    {
      icon: Gift,
      text: program.minimum_transaction_amount > 0
        ? `They pay a bill of ${formatNaira(program.minimum_transaction_amount)}+ and you earn ${formatNaira(program.reward_amount)}`
        : `They pay their first bill and you earn ${formatNaira(program.reward_amount)}`,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="gradient-primary p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Users className="h-4 w-4" />Refer & earn</p>
            <h2 className="mt-2 text-xl font-bold">
              {isActive ? `Earn ${formatNaira(program.reward_amount)} for every friend` : "Invite friends to GapCastle"}
            </h2>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-2xl font-bold">{referral.total_referred}</p>
            <p className="text-xs opacity-80">friends joined</p>
          </div>
        </div>

        {!isActive && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
            <PauseCircle className="h-4 w-4 shrink-0" />Referral bonuses are paused right now. Friends can still join with your code.
          </p>
        )}
      </div>

      <div className="space-y-5 p-6">
        {isActive && (
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                <span className="text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <div>
            <Label className="text-xs text-muted-foreground">Your code</Label>
            <button
              type="button"
              onClick={() => copy(referral.code, "Referral code")}
              className="mt-1 flex w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-accent px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-primary transition hover:border-primary"
            >
              {referral.code}
              {copied === referral.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 opacity-60" />}
            </button>
          </div>
          <div className="min-w-0">
            <Label className="text-xs text-muted-foreground">Your invite link</Label>
            <div className="mt-1 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-muted/40 px-3 text-sm">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{link}</span>
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl" onClick={() => copy(link, "Invite link")} aria-label="Copy invite link">
                {copied === link ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={share} className="flex-1 sm:flex-none"><Share2 className="mr-2 h-4 w-4" />Share invite</Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReferralList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReferrals(page);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="mb-4 font-semibold">Your referrals</h2>
      {isLoading ? <RowSkeletons count={3} /> : !data?.items.length ? (
        <EmptyState icon={Users} title="No referrals yet" text="Friends who sign up with your code will appear here." />
      ) : (
        <div className="space-y-4">
          <div className="divide-y">
            {data.items.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">Joined {formatDate(r.joined_at)}</p>
                  </div>
                </div>
                {r.rewarded ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />Earned</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600"><Clock className="h-3.5 w-3.5" />Awaiting payment</span>
                )}
              </div>
            ))}
          </div>
          <Pager meta={data.meta} onPage={setPage} noun="referrals" />
        </div>
      )}
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────
function HistoryRow({ entry }: { entry: RewardEntry }) {
  const { icon: Icon, className } = entryStyles[entry.type] ?? entryStyles.cashback;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.description}</p>
          <p className="truncate text-xs text-muted-foreground">
            {entry.type_label} · {formatDate(entry.created_at)}
            {entry.transaction_reference && <span className="hidden sm:inline"> · {entry.transaction_reference}</span>}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-semibold ${entry.is_credit ? "text-success" : "text-foreground"}`}>
          {entry.is_credit ? "+" : "−"}{formatNaira(entry.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground">Bal. {formatNaira(entry.balance_after)}</p>
      </div>
    </div>
  );
}

function RewardHistory() {
  const [filter, setFilter] = useState<"all" | RewardType>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useRewardHistory(page, filter === "all" ? undefined : filter);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-muted-foreground" />Reward history</h2>
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setPage(1); }}>
          <TabsList className="w-full sm:w-auto">
            {historyFilters.map((f) => <TabsTrigger key={f.value} value={f.value} className="flex-1 text-xs sm:flex-none">{f.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? <RowSkeletons /> : !data?.items.length ? (
        <EmptyState
          icon={Gift}
          title={filter === "all" ? "No rewards yet" : `No ${historyFilters.find((f) => f.value === filter)?.label.toLowerCase()} yet`}
          text="Pay bills to earn cashback, or invite friends to earn referral bonuses."
        />
      ) : (
        <div className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
          <div className="divide-y">
            {data.items.map((entry) => <HistoryRow key={entry.id} entry={entry} />)}
          </div>
          <Pager meta={data.meta} onPage={setPage} noun="entries" />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function Rewards() {
  const { data: summary, isLoading } = useRewardsSummary();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawKey, setWithdrawKey] = useState(0);
  const balance = summary?.balance ?? 0;

  const openWithdraw = () => {
    setWithdrawKey((k) => k + 1);
    setWithdrawOpen(true);
  };

  const stats = [
    { label: "Cashback earned", value: summary?.total_cashback_earned, icon: Coins, className: "bg-success/10 text-success" },
    { label: "Referral bonuses", value: summary?.total_referral_earned, icon: UserPlus, className: "bg-primary/10 text-primary" },
    { label: "Moved to wallet", value: summary?.total_withdrawn, icon: Wallet, className: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-sm text-muted-foreground">Cashback on every payment, plus bonuses for inviting friends.</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl gradient-success p-6 text-success-foreground shadow-elegant">
        <Gift className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rotate-12 opacity-10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90"><Gift className="h-4 w-4" />Rewards balance</p>
            {isLoading ? <Skeleton className="mt-3 h-10 w-48 bg-white/20" /> : <p className="mt-2 text-4xl font-bold">{formatNaira(balance)}</p>}
            <p className="mt-1 text-sm opacity-90">Move it to your wallet whenever you like.</p>
          </div>
          <Button
            onClick={openWithdraw}
            disabled={isLoading || balance < 1}
            className="bg-white text-emerald-700 shadow-lg hover:bg-white/90"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />Move to wallet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, className }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {isLoading ? <Skeleton className="mt-1 h-5 w-20" /> : <p className="font-semibold">{formatNaira(value ?? 0)}</p>}
            </div>
          </div>
        ))}
      </div>

      <ReferralCard />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><RewardHistory /></div>
        <div className="lg:col-span-2"><ReferralList /></div>
      </div>

      <WithdrawDialog key={withdrawKey} open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={balance} />
    </div>
  );
}
