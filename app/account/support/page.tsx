"use client";
import { useState } from "react";
import { useTickets } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Search, Plus, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function SupportPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const { data: tickets = [], isLoading } = useTickets(tab === "all" ? "" : tab);
  const router = useRouter();

  const filtered = tickets.filter(t => {
    if (q && !`${t.subject} ${t.reference}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Need help? We're here for you.</p>
        </div>
        <Button onClick={() => router.push("/account/support/new")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {["all", "open", "in_progress", "waiting_on_customer", "resolved", "closed"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {t === "all" ? "All Tickets" : t.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search subject or reference…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No tickets found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {q ? "No tickets match your search criteria." : "You haven't opened any support tickets yet."}
            </p>
            {!q && (
              <Button variant="outline" className="mt-6" onClick={() => router.push("/account/support/new")}>
                Create your first ticket
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/account/support/${t.id}`)}
                className="flex cursor-pointer flex-col gap-3 p-5 hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{t.reference}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'waiting_on_customer' ? 'bg-purple-100 text-purple-700' :
                          t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                      }`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                    {t.priority === 'urgent' && <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700">Urgent</span>}
                  </div>
                  <h3 className="truncate font-semibold text-foreground">{t.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} •
                    Updated {formatDate(t.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <MessageCircle className="h-4 w-4" />
                    <span>{t.messages_count ?? 1}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
