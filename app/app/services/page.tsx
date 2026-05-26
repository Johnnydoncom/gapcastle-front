"use client";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";
import * as Icons from "lucide-react";

export default function Services() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">Pick a service to get started.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SERVICE_CATEGORIES.map((s) => {
          const Icon = (Icons as any)[s.icon];
          return (
            <Link key={s.slug} href={`/app/${s.href}`} className="group rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><Icon className="h-6 w-6" /></div>
              <h3 className="mt-4 font-semibold">{s.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
