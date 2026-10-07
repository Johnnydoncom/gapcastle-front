"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2, MoreVertical, Pencil, Search, Settings2, Trash2, UserRound, Users, X } from "lucide-react";
import { useBillBeneficiaries, useBillBeneficiaryMutations, type BillBeneficiary } from "@/hooks/useGapcastle";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BeneficiarySelectProps {
  /** Bill service slug — the registry key. */
  category: string;
  /** The provider chosen above; only recipients paid on it are offered. */
  providerId?: number;
  providerName?: string;
  /** The beneficiary the form currently matches, shown in the trigger. */
  activeId: number | null;
  onSelect: (beneficiary: BillBeneficiary) => void;
}

/**
 * Saved-recipient dropdown, placed directly under the provider field and
 * scoped to that provider: a recipient on another network or DisCo cannot be
 * paid here anyway, so listing them would only add noise.
 *
 * Renders nothing until a provider is chosen, for a service that keeps no
 * beneficiaries, or when nobody has been paid on this provider yet — so
 * first-time payers see the plain form.
 */
export function BeneficiarySelect({ category, providerId, providerName, activeId, onSelect }: BeneficiarySelectProps) {
  const { data } = useBillBeneficiaries(category);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const beneficiaries = useMemo(
    () => (data?.items ?? []).filter((b) => b.bill_provider_id === providerId),
    [data?.items, providerId],
  );

  const filtered = useMemo(() => filterBeneficiaries(beneficiaries, search), [beneficiaries, search]);
  const selected = beneficiaries.find((b) => b.id === activeId) ?? null;

  const close = () => { setOpen(false); setSearch(""); };

  // Close on outside click or Escape, like ProviderSelect.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Switching provider changes the list underneath an open panel, so close
  // it — adjusted during render rather than in an effect.
  const [panelProviderId, setPanelProviderId] = useState(providerId);
  if (panelProviderId !== providerId) {
    setPanelProviderId(providerId);
    setOpen(false);
    setSearch("");
  }

  if (!providerId || !data?.supported || beneficiaries.length === 0) return null;

  const showSearch = beneficiaries.length > 4;

  return (
    <div className="space-y-2">
      <Label htmlFor="beneficiary-select">Saved Beneficiary</Label>

      <div ref={containerRef} className="relative w-full">
        <button
          id="beneficiary-select"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-all duration-200",
            "hover:border-primary/50 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            open && "border-primary ring-2 ring-primary/20 shadow-sm",
          )}
        >
          {selected ? (
            <>
              <RecipientAvatar beneficiary={selected} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{primaryLabel(selected)}</span>
                {selected.display_name && (
                  <span className="block truncate font-mono text-xs text-muted-foreground">{selected.customer}</span>
                )}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </span>
              <span className="flex-1 text-muted-foreground">Choose a saved beneficiary</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {beneficiaries.length} saved
              </span>
            </>
          )}
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {showSearch && (
              <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or number…"
                  aria-label="Search saved beneficiaries"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}

            <div role="listbox" aria-label="Saved beneficiaries" className="max-h-72 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No beneficiary matches &ldquo;{search}&rdquo;.</div>
              ) : (
                filtered.map((b) => {
                  const isSelected = b.id === activeId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { onSelect(b); close(); }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150",
                        "hover:bg-accent/60",
                        isSelected && "bg-primary/8 ring-1 ring-primary/20",
                      )}
                    >
                      <RecipientAvatar beneficiary={b} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate font-medium", isSelected && "text-primary")}>{primaryLabel(b)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {b.display_name && <span className="font-mono">{b.customer} · </span>}
                          {lastPaidLabel(b)}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t p-1.5">
              <button
                type="button"
                onClick={() => { close(); setManageOpen(true); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary transition hover:bg-primary/5"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Rename or remove beneficiaries
              </button>
            </div>
          </div>
        )}
      </div>

      <ManageBeneficiariesSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        beneficiaries={beneficiaries}
        providerName={providerName}
      />
    </div>
  );
}

export function ManageBeneficiariesSheet({
  open, onOpenChange, beneficiaries, providerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaries: BillBeneficiary[];
  providerName?: string;
}) {
  const { rename, remove } = useBillBeneficiaryMutations();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<BillBeneficiary | null>(null);

  const filtered = useMemo(() => filterBeneficiaries(beneficiaries, search), [beneficiaries, search]);

  const saveName = async (b: BillBeneficiary) => {
    try {
      await rename.mutateAsync({ id: b.id, nickname: draftName.trim() });
      setEditingId(null);
      toast.success(draftName.trim() ? "Beneficiary renamed." : "Nickname removed.");
    } catch {
      toast.error("Could not rename this beneficiary. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Beneficiary removed.");
    } catch {
      toast.error("Could not remove this beneficiary. Please try again.");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) { setSearch(""); setEditingId(null); }
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>Saved beneficiaries</SheetTitle>
            <SheetDescription>
              {providerName ? `People you've paid on ${providerName}. ` : ""}
              Give them a nickname so they&apos;re easy to find.
            </SheetDescription>
          </SheetHeader>

          {beneficiaries.length > 4 && (
            <div className="border-b px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or number"
                  className="pl-9"
                  aria-label="Search beneficiaries"
                />
              </div>
            </div>
          )}

          <ul className="flex-1 divide-y overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                {beneficiaries.length === 0 ? "No saved beneficiaries." : <>No beneficiary matches &ldquo;{search}&rdquo;.</>}
              </li>
            )}
            {filtered.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                <RecipientAvatar beneficiary={b} size="md" />

                {editingId === b.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                    onSubmit={(e) => { e.preventDefault(); saveName(b); }}
                  >
                    <Input
                      autoFocus
                      value={draftName}
                      maxLength={60}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditingId(null); } }}
                      placeholder={b.customer_name ?? "e.g. Mum's line"}
                      className="h-9"
                      aria-label="Nickname"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={rename.isPending} aria-label="Save nickname">
                      {rename.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditingId(null)} aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{primaryLabel(b)}</p>
                      {b.display_name && <p className="truncate font-mono text-xs text-muted-foreground">{b.customer}</p>}
                      {b.nickname && b.customer_name && (
                        <p className="truncate text-[11px] text-muted-foreground">{b.customer_name}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">{lastPaidLabel(b)}</p>
                    </div>

                    {/* Non-modal so the Remove dialog it opens does not leave the page inert. */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Manage ${primaryLabel(b)}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem onSelect={() => { setEditingId(b.id); setDraftName(b.nickname ?? ""); }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> {b.nickname ? "Rename" : "Add nickname"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setPendingDelete(b)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(next) => { if (!next) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && <>{primaryLabel(pendingDelete)}{pendingDelete.display_name ? ` (${pendingDelete.customer})` : ""} will no longer appear in your saved list. </>}
              Past transactions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const AVATAR_COLORS = [
  "bg-blue-500/15 text-blue-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-violet-500/15 text-violet-600",
  "bg-amber-500/15 text-amber-600",
  "bg-rose-500/15 text-rose-600",
  "bg-cyan-500/15 text-cyan-600",
  "bg-fuchsia-500/15 text-fuchsia-600",
  "bg-teal-500/15 text-teal-600",
];

/**
 * Initials of the person when we know a name, a neutral person icon when we
 * only have a number. Every entry shares the provider, so its logo would not
 * tell them apart.
 */
export function RecipientAvatar({ beneficiary, size }: { beneficiary: BillBeneficiary; size: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const name = beneficiary.display_name;
  const color = AVATAR_COLORS[[...beneficiary.customer].reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

  return (
    <span className={cn(dim, "flex shrink-0 items-center justify-center rounded-full font-bold", color)}>
      {name ? initials(name) : <UserRound className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />}
    </span>
  );
}

/** The nickname, else the biller-verified name, else the number itself. */
export function primaryLabel(b: BillBeneficiary): string {
  return b.display_name || b.customer;
}

function initials(label: string): string {
  const words = label.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "•";
}

function filterBeneficiaries(beneficiaries: BillBeneficiary[], search: string): BillBeneficiary[] {
  const term = search.trim().toLowerCase();
  if (!term) return beneficiaries;
  return beneficiaries.filter((b) =>
    [b.nickname, b.customer_name, b.customer].some((v) => v?.toLowerCase().includes(term)),
  );
}

export function lastPaidLabel(b: BillBeneficiary): string {
  const parts = [
    b.last_amount != null ? `Last paid ${formatNaira(b.last_amount)}` : null,
    b.last_used_at ? relativeDay(b.last_used_at) : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
