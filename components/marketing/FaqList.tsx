import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };

/**
 * FAQ list built on native <details>, so every answer is in the server HTML
 * (crawlers and answer engines read it) and it works without JavaScript.
 * Pair it with faqSchema() from lib/structured-data.ts.
 */
export function FaqList({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.q} className="group overflow-hidden rounded-2xl border bg-card px-5 shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold">{faq.q}</h3>
            <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-muted-foreground">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
