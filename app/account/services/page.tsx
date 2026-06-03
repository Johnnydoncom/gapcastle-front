"use client";
import Link from "next/link";
import { useServices } from "@/hooks/useGapcastle";
import { getServiceUi } from "@/lib/services";
import * as Icons from "lucide-react";
import { CircleDollarSign } from "lucide-react";

export default function Services() {
  const { data: services, isLoading } = useServices();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">Pick a service to get started.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border bg-muted" />
          ))}
        </div>
      ) : !services?.length ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No active services at the moment. Please check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {services.map((s: { slug: string; name: string; description?: string }) => {
            const ui = getServiceUi(s.slug);
            const Icon = ((Icons as any)[ui.icon] ?? CircleDollarSign) as React.ElementType;
            return (
              <Link
                key={s.slug}
                href={`/account/${ui.href}`}
                className="group rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ui.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{s.name || ui.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.description || ui.description}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
