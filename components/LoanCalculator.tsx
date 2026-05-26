"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calculator, ArrowRight } from "lucide-react";
import { formatNaira } from "@/lib/format";

export function LoanCalculator() {
  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(3);
  const monthlyRate = 0.04; // 4% per month flat fee
  const totalInterest = amount * monthlyRate * months;
  const total = amount + totalInterest;
  const monthlyPayment = total / months;

  return (
    <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-5 animate-fade-in-up">
      <div className="rounded-3xl border bg-card p-8 shadow-card lg:col-span-3">
        <Calculator className="h-7 w-7 text-primary" />
        <div className="mt-6 space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Loan amount</label>
              <span className="text-lg font-bold gradient-text">{formatNaira(amount)}</span>
            </div>
            <Slider value={[amount]} onValueChange={(v) => setAmount(v[0])} min={10000} max={5000000} step={10000} className="mt-3" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>₦10k</span><span>₦5M</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Repayment period</label>
              <span className="text-lg font-bold gradient-text">{months} {months === 1 ? "month" : "months"}</span>
            </div>
            <Slider value={[months]} onValueChange={(v) => setMonths(v[0])} min={1} max={12} step={1} className="mt-3" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>1 mo</span><span>12 mo</span></div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elegant lg:col-span-2">
        <p className="text-sm opacity-80">Monthly payment</p>
        <p className="mt-1 text-4xl font-bold">{formatNaira(monthlyPayment)}</p>
        <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
          <div className="flex justify-between"><span className="opacity-80">Principal</span><span className="font-semibold">{formatNaira(amount)}</span></div>
          <div className="flex justify-between"><span className="opacity-80">Total interest</span><span className="font-semibold">{formatNaira(totalInterest)}</span></div>
          <div className="flex justify-between"><span className="opacity-80">Total repayment</span><span className="font-semibold">{formatNaira(total)}</span></div>
        </div>
        <Link href="/signup"><Button variant="secondary" className="mt-6 w-full gap-2">Apply now <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}
