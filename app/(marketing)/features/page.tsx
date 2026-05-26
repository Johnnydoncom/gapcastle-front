"use client";
import Link from "next/link";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Zap, Gift, Receipt, Wallet, Users, Bell, Lock, BarChart3, Repeat,
  Smartphone, CreditCard, Globe, Headphones, ArrowRight, Check, Sparkles, Clock, FileText,
} from "lucide-react";

const big = [
  { icon: Wallet, title: "Smart Wallet", text: "Fund once, pay anything. Top up via card, transfer or USSD and use your balance across all services with one tap.", color: "from-blue-500/20 to-purple-500/10" },
  { icon: Gift, title: "2% Cashback Program", text: "Earn real money on every transaction. Withdraw cashback to your wallet or use it for your next bill.", color: "from-emerald-500/20 to-teal-500/10" },
  { icon: Repeat, title: "Auto-Pay & Reminders", text: "Schedule recurring payments for rent, subscriptions and utilities. Never miss a due date again.", color: "from-amber-500/20 to-orange-500/10" },
  { icon: ShieldCheck, title: "Bank-Grade Security", text: "256-bit encryption, biometric login, transaction PIN and PCI-DSS compliant payment infrastructure.", color: "from-pink-500/20 to-rose-500/10" },
];

const grid = [
  { icon: Zap, title: "Instant delivery", text: "Most transactions confirm in under 5 seconds via direct biller APIs." },
  { icon: Receipt, title: "Digital receipts", text: "Every transaction generates a downloadable PDF receipt with biller token." },
  { icon: Users, title: "Beneficiaries", text: "Save phone numbers, meter numbers and smartcard IDs for one-tap re-pay." },
  { icon: Bell, title: "Smart notifications", text: "Get push, SMS or email alerts the moment your transaction completes." },
  { icon: Lock, title: "Transaction PIN", text: "A 4-digit PIN protects every payment, even if your phone is unlocked." },
  { icon: BarChart3, title: "Spending insights", text: "See where your money goes each month with category-based analytics." },
  { icon: Smartphone, title: "Network auto-detect", text: "Type a phone number — we detect MTN, Airtel, Glo or 9mobile automatically." },
  { icon: CreditCard, title: "Multiple payment methods", text: "Cards, bank transfer, USSD, wallet — pay however you like." },
  { icon: Globe, title: "Cross-border ready", text: "Built for Nigeria, Ghana and beyond. Multi-currency on the roadmap." },
  { icon: Headphones, title: "24/7 human support", text: "Real Nigerians answering chat, email and phone — no bots, no scripts." },
  { icon: Clock, title: "Transaction history", text: "Searchable, filterable, exportable history going back to day one." },
  { icon: FileText, title: "Bulk uploads", text: "Pay 100 staff airtime in one CSV. Built for SMEs and HR teams." },
];

const compare = [
  { feature: "Instant bill payment", us: true, banks: true, ussd: false },
  { feature: "Cashback on every payment", us: true, banks: false, ussd: false },
  { feature: "Save beneficiaries", us: true, banks: true, ussd: false },
  { feature: "Auto-pay scheduling", us: true, banks: false, ussd: false },
  { feature: "Spending analytics", us: true, banks: false, ussd: false },
  { feature: "24/7 chat support", us: true, banks: false, ussd: false },
  { feature: "Free to use", us: true, banks: false, ussd: true },
  { feature: "Works without internet", us: false, banks: false, ussd: true },
];

export default function Features() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={<>Everything you need to <span className="gradient-text">pay smarter</span></>}
        subtitle="One app, twelve standout features and zero hidden fees. Built for the way Nigerians actually pay bills."
      >
        <Link href="/signup"><Button size="lg" className="gap-2 group">Try it free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
      </PageHero>

      {/* Hero feature cards */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {big.map(({ icon: Icon, title, text, color }, i) => (
            <div key={title} style={{ animationDelay: `${i * 100}ms` }} className={`group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-card hover-lift animate-fade-in-up`}>
              <div className={`absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br ${color} blur-3xl opacity-60 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary transition-transform group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">{title}</h3>
                <p className="mt-3 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid features */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="More features" title="The little things that add up" subtitle="A dozen thoughtful details that turn paying a bill into a pleasant moment." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map(({ icon: Icon, title, text }, i) => (
              <div key={title} style={{ animationDelay: `${i * 50}ms` }} className="group rounded-2xl border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant animate-fade-in-up">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:rotate-6">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="container py-20">
        <SectionHeader eyebrow="Compare" title="GapCastle vs the alternatives" subtitle="See how we stack up against traditional bank apps and USSD codes." />
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-card animate-fade-in-up">
          <div className="grid grid-cols-4 gap-4 border-b bg-secondary/40 p-4 text-sm font-semibold">
            <div>Feature</div>
            <div className="text-center text-primary">GapCastle</div>
            <div className="text-center">Bank apps</div>
            <div className="text-center">USSD</div>
          </div>
          {compare.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-4 gap-4 p-4 text-sm ${i % 2 ? "bg-secondary/20" : ""}`}>
              <div className="font-medium">{row.feature}</div>
              <div className="flex justify-center">{row.us ? <Check className="h-5 w-5 text-success" /> : <span className="text-muted-foreground">—</span>}</div>
              <div className="flex justify-center">{row.banks ? <Check className="h-5 w-5 text-success" /> : <span className="text-muted-foreground">—</span>}</div>
              <div className="flex justify-center">{row.ussd ? <Check className="h-5 w-5 text-success" /> : <span className="text-muted-foreground">—</span>}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-center text-primary-foreground md:p-16">
          <Sparkles className="mx-auto h-10 w-10 animate-float" />
          <h3 className="mt-4 text-3xl font-bold md:text-4xl">All these features. Zero monthly fees.</h3>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Sign up in under a minute. Pay your first bill in three taps.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup"><Button size="lg" variant="secondary" className="gap-2">Get started free <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
