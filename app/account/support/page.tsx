"use client";
import { useState } from "react";
import Link from "next/link";
import { useTickets } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { ticketCategoryLabel, ticketStatusLabel, ticketStatusStyle } from "@/lib/support";
import { Search, Plus, MessageCircle, ChevronRight } from "lucide-react";

const TABS = ["all", "open", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;

export default function SupportPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");
  const { data: tickets = [], isLoading, isError, error, refetch } = useTickets(tab === "all" ? "" : tab);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? tickets.filter(t => `${t.subject} ${t.reference}`.toLowerCase().includes(needle))
    : tickets;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Need help? We&apos;re here for you.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/account/support/new">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {t === "all" ? "All Tickets" : ticketStatusLabel(t)}
            </button>
          ))}
        </div>
        <div className="relative w-full shrink-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject or reference…"
            aria-label="Search tickets"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading tickets...</div>
        ) : isError ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm text-destructive">{error?.message || "We couldn't load your tickets."}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No tickets found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {needle
                ? "No tickets match your search criteria."
                : tab === "all"
                  ? "You haven't opened any support tickets yet."
                  : `You have no ${ticketStatusLabel(tab).toLowerCase()} tickets.`}
            </p>
            {!needle && tab === "all" && (
              <Button asChild variant="outline" className="mt-6">
                <Link href="/account/support/new">Create your first ticket</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/account/support/${t.id}`}
                className="group flex flex-col gap-3 p-5 transition-colors hover:bg-secondary/30 focus-visible:bg-secondary/30 focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{t.reference}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${ticketStatusStyle(t.status)}`}>
                      {ticketStatusLabel(t.status)}
                    </span>
                    {t.priority === "urgent" && (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700">Urgent</span>
                    )}
                  </div>
                  <h3 className="truncate font-semibold text-foreground">{t.subject}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ticketCategoryLabel(t.category)} • Updated {formatDate(t.updated_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-sm" aria-label={`${t.messages_count ?? 1} messages`}>
                    <MessageCircle className="h-4 w-4" />
                    <span>{t.messages_count ?? 1}</span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
