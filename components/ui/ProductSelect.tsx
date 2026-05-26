"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

interface Product {
  id: number;
  name: string;
  amount: number | string;
  variation_code?: string;
}

interface ProductSelectProps {
  products: Product[];
  value?: number | string;
  onValueChange: (value: number) => void;
  placeholder?: string;
}

export function ProductSelect({ products, value, onValueChange, placeholder = "Select a plan..." }: ProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = products.find((p) => p.id === Number(value));

  const filteredProducts = products.filter(
    (p) =>
      Number(p.amount) > 0 &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-[56px] w-full items-center justify-between rounded-2xl border bg-background px-4 py-2 text-sm transition-all duration-300 hover:border-primary/40 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10",
          isOpen ? "border-primary shadow-sm ring-4 ring-primary/10" : "border-input",
          !selectedProduct && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedProduct ? (
            <div className="flex items-center gap-3 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start text-left truncate">
                <span className="font-semibold text-foreground truncate">{selectedProduct.name}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatNaira(selectedProduct.amount)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full animate-in fade-in zoom-in-95 rounded-2xl border bg-card text-card-foreground shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 bg-muted/20">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No plans found.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredProducts.map((p) => {
                  const isSelected = p.id === Number(value);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onValueChange(p.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "group relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200",
                        isSelected
                          ? "bg-primary/5 border border-primary/20 shadow-sm"
                          : "border border-transparent hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex flex-col items-start truncate text-left">
                          <span
                            className={cn(
                              "font-semibold truncate transition-colors",
                              isSelected ? "text-primary" : "text-foreground group-hover:text-primary/80"
                            )}
                          >
                            {p.name}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-bold tracking-wide shrink-0 transition-all duration-200 border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/20"
                              : "bg-background text-muted-foreground border-border shadow-sm group-hover:border-primary/30 group-hover:text-foreground"
                          )}
                        >
                          {formatNaira(p.amount)}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-r-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
