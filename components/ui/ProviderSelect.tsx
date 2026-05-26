"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: number;
  name: string;
  logo?: string;
  logo_emoji?: string;
  slug?: string;
}

interface ProviderSelectProps {
  providers: Provider[];
  value?: number;
  onValueChange: (id: number) => void;
  placeholder?: string;
}

export function ProviderSelect({ providers, value, onValueChange, placeholder = "Select Provider" }: ProviderSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = providers.find((p) => p.id === value);

  const filtered = search
    ? providers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : providers;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-all duration-200",
          "hover:border-primary/50 hover:shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          open && "border-primary ring-2 ring-primary/20 shadow-sm",
          !selected && "text-muted-foreground"
        )}
      >
        {selected ? (
          <>
            <ProviderAvatar provider={selected} size="sm" />
            <span className="flex-1 font-medium text-foreground">{selected.name}</span>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </div>
            <span className="flex-1">{placeholder}</span>
          </>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Search Input */}
          {providers.length > 4 && (
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search providers…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No providers found.</div>
            ) : (
              filtered.map((p) => {
                const isSelected = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onValueChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150",
                      "hover:bg-accent/60",
                      isSelected && "bg-primary/8 ring-1 ring-primary/20"
                    )}
                  >
                    <ProviderAvatar provider={p} size="md" />
                    <span className={cn("flex-1 font-medium", isSelected && "text-primary")}>{p.name}</span>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderAvatar({ provider, size = "md" }: { provider: Provider; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-sm" : "text-lg";

  if (provider.logo) {
    return (
      <div className={cn(dim, "shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border/50")}>
        <img
          src={provider.logo}
          alt={provider.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to initials on broken image
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="flex h-full w-full items-center justify-center font-bold ${textSize} text-primary">${provider.name.charAt(0)}</span>`;
          }}
        />
      </div>
    );
  }

  if (provider.logo_emoji) {
    return (
      <div className={cn(dim, "shrink-0 flex items-center justify-center rounded-full bg-primary/10", textSize)}>
        {provider.logo_emoji}
      </div>
    );
  }

  // Deterministic color from name
  const colors = [
    "bg-blue-500/15 text-blue-600",
    "bg-emerald-500/15 text-emerald-600",
    "bg-violet-500/15 text-violet-600",
    "bg-amber-500/15 text-amber-600",
    "bg-rose-500/15 text-rose-600",
    "bg-cyan-500/15 text-cyan-600",
    "bg-fuchsia-500/15 text-fuchsia-600",
    "bg-teal-500/15 text-teal-600",
  ];
  const colorIdx = provider.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <div className={cn(dim, "shrink-0 flex items-center justify-center rounded-full font-bold", textSize, colors[colorIdx])}>
      {provider.name.charAt(0).toUpperCase()}
    </div>
  );
}
