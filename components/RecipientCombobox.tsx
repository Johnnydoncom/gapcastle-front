"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookUser, Check, Settings2 } from "lucide-react";
import type { BillBeneficiary } from "@/hooks/useGapcastle";
import { ManageBeneficiariesSheet, RecipientAvatar, lastPaidLabel, primaryLabel } from "@/components/BeneficiarySelect";
import { cn } from "@/lib/utils";

/** Props the combobox needs spread onto the text input it enhances. */
export interface ComboboxInputProps {
  role?: "combobox";
  autoComplete?: string;
  "aria-autocomplete"?: "list";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-activedescendant"?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
  onInput?: React.FormEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  className?: string;
}

interface RecipientComboboxProps {
  /** Saved recipients on the selected provider that carry `valueKey`. */
  beneficiaries: BillBeneficiary[];
  /** The form field this input edits (identifier or phone). */
  valueKey: string;
  /** Current input value, used to filter. */
  query: unknown;
  activeId: number | null;
  providerName?: string;
  onSelect: (beneficiary: BillBeneficiary) => void;
  className?: string;
  /** Renders the input; spread the given props onto it. */
  children: (inputProps: ComboboxInputProps) => React.ReactNode;
}

/**
 * Turns the recipient field (phone, meter, smartcard, account) into a
 * searchable combobox: typing still enters a new recipient as before, while
 * saved beneficiaries that match what is typed are offered underneath.
 */
export function RecipientCombobox({
  beneficiaries, valueKey, query, activeId, providerName, onSelect, className, children,
}: RecipientComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [manageOpen, setManageOpen] = useState(false);

  const options = useMemo(() => {
    const term = normalise(query);
    const active = beneficiaries.find((b) => b.id === activeId);
    // The field already holds a saved recipient: offer the whole list so the
    // customer can switch, rather than just the one already chosen.
    if (!term || (active && normalise(active.details?.[valueKey]) === term)) return beneficiaries;

    return beneficiaries.filter((b) =>
      [b.details?.[valueKey], b.customer, b.nickname, b.customer_name].some((v) => normalise(v).includes(term)),
    );
  }, [beneficiaries, query, activeId, valueKey]);

  const showList = open && options.length > 0;
  // Typing resets the highlight (see onInput); this guards a list that shrank.
  const activeIndex = highlighted < options.length ? highlighted : -1;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const choose = (b: BillBeneficiary) => {
    onSelect(b);
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter" && showList && activeIndex >= 0) {
      // Pick the option instead of submitting the form.
      e.preventDefault();
      choose(options[activeIndex]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-option-${i}`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children({
        role: "combobox",
        autoComplete: "off",
        "aria-autocomplete": "list",
        "aria-expanded": showList,
        "aria-controls": listId,
        "aria-activedescendant": showList && activeIndex >= 0 ? optionId(activeIndex) : undefined,
        onFocus: () => setOpen(true),
        onClick: () => setOpen(true),
        onInput: () => { setOpen(true); setHighlighted(-1); },
        onKeyDown,
        className: "pr-11",
      })}

      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Show saved beneficiaries (${beneficiaries.length})`}
        title="Saved beneficiaries"
        className={cn(
          "absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary",
          showList && "bg-primary/10 text-primary",
        )}
      >
        <BookUser className="h-4 w-4" />
      </button>

      {showList && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Saved beneficiaries
          </p>
          <ul id={listId} role="listbox" aria-label="Saved beneficiaries" className="max-h-64 overflow-y-auto p-1.5">
            {options.map((b, i) => {
              const isActive = b.id === activeId;
              const value = String(b.details?.[valueKey] ?? b.customer);
              return (
                <li
                  key={b.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isActive}
                  // mousedown keeps focus in the input; click would blur it first.
                  onMouseDown={(e) => { e.preventDefault(); choose(b); }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    i === activeIndex && "bg-accent/70",
                    isActive && "bg-primary/8",
                  )}
                >
                  <RecipientAvatar beneficiary={b} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate font-medium", isActive && "text-primary")}>
                      {b.display_name ? primaryLabel(b) : value}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.display_name && <span className="font-mono">{value} · </span>}
                      {lastPaidLabel(b)}
                    </span>
                  </span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </li>
              );
            })}
          </ul>
          <div className="border-t p-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setOpen(false); setManageOpen(true); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary transition hover:bg-primary/5"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Rename or remove beneficiaries
            </button>
          </div>
        </div>
      )}

      <ManageBeneficiariesSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        beneficiaries={beneficiaries}
        providerName={providerName}
      />
    </div>
  );
}

/** Case-, space- and country-code-insensitive form for matching. */
function normalise(value: unknown): string {
  const compact = String(value ?? "").replace(/\s+/g, "").toLowerCase();
  const intl = compact.match(/^\+?234(\d{10})$/);
  return intl ? `0${intl[1]}` : compact;
}
