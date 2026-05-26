import Link from "next/link";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Banknote, Clock, ShieldCheck, TrendingUp, Briefcase, GraduationCap, Home, Heart, Smartphone,
  Check, ArrowRight, Sparkles, FileCheck, Wallet, Users,
} from "lucide-react";
import { LoanCalculator } from "@/components/LoanCalculator";

const products = [
  { icon: Smartphone, title: "Airtime Advance", range: "₦100 – ₦5,000", tenor: "7 days", text: "Run out of airtime at midnight? Borrow instantly and repay on your next top-up." },
  { icon: Wallet, title: "Salary Loan", range: "₦20,000 – ₦500,000", tenor: "30 days", text: "Bridge the gap before payday. Get up to 50% of your verified monthly salary in minutes." },
  { icon: GraduationCap, title: "School Fees Loan", range: "₦50,000 – ₦1,000,000", tenor: "3 – 12 months", text: "Don't let fees delay the semester. Flexible repayment aligned to academic terms." },
  { icon: Briefcase, title: "SME Working Capital", range: "₦100,000 – ₦5,000,000", tenor: "3 – 12 months", text: "Restock inventory or cover payroll. Designed for traders, salons and small businesses." },
  { icon: Heart, title: "Emergency Loan", range: "₦10,000 – ₦200,000", tenor: "14 – 30 days", text: "Medical, transport or family emergencies — get funds in under 10 minutes." },
  { icon: Home, title: "Rent Assist", range: "₦100,000 – ₦2,000,000", tenor: "6 – 12 months", text: "Pay your landlord upfront, repay us monthly. Avoid eviction stress." },
];

const why = [
  { icon: Clock, title: "Approval in 10 minutes", text: "No paper forms. No bank visits. Apply, verify, get a decision — all in your pocket." },
  { icon: ShieldCheck, title: "No collateral required", text: "We use smart credit scoring instead of asset pledges. Your phone is enough." },
  { icon: TrendingUp, title: "Build your credit score", text: "Every on-time repayment improves your GapCastle credit limit and unlocks better rates." },
  { icon: Banknote, title: "Transparent pricing", text: "One flat fee, shown upfront. No hidden interest, late penalties or surprise charges." },
];

const steps = [
  { n: "1", title: "Apply in-app", text: "Choose your loan product, amount and tenor. Takes about 60 seconds." },
  { n: "2", title: "Quick verification", text: "Connect your BVN and bank statement. Our system scores you instantly." },
  { n: "3", title: "Get instant decision", text: "Approved? Funds hit your GapCastle wallet in minutes." },
  { n: "4", title: "Repay on schedule", text: "Auto-debit on due date or pay early to save on fees and grow your limit." },
];

const eligibility = [
  "Nigerian resident, 18 years or older",
  "Valid BVN and government-issued ID",
  "Active GapCastle account for 30+ days (for larger loans)",
  "Verifiable income source (salary, business or remittance)",
  "Mobile phone number registered in your name",
];

export default function Loans() {
  return (
    <>
      <PageHero
        eyebrow="GapCastle Loans"
        title={<>Quick, fair credit when <span className="gradient-text">you need it most</span></>}
        subtitle="From airtime advances to SME working capital — borrow up to ₦5M, get approved in 10 minutes, no collateral required."
      >
        <Link href="/signup"><Button size="lg" className="gap-2 group">Apply for a loan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
        <a href="#calculator"><Button size="lg" variant="outline">Calculate repayment</Button></a>
      </PageHero>

      {/* Why */}
      <section className="container py-20">
        <SectionHeader eyebrow="Why borrow with us" title="Loans built for real Nigerians" subtitle="No collateral. No paperwork. No drama. Just credit that meets you where you are." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {why.map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="group rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary transition-transform group-hover:scale-110 group-hover:rotate-6">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="Loan products" title="A loan for every life moment" subtitle="Six tailored products covering everything from a midnight airtime emergency to scaling your small business." />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map(({ icon: Icon, title, range, tenor, text }, i) => (
              <div key={title} style={{ animationDelay: `${i * 70}ms` }} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
                <div className="absolute inset-x-0 -top-24 -z-0 h-40 gradient-primary opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:rotate-6">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
                    <div><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">{range}</dd></div>
                    <div><dt className="text-muted-foreground">Tenor</dt><dd className="font-semibold">{tenor}</dd></div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="container py-20">
        <SectionHeader eyebrow="Loan calculator" title="Estimate your repayment" subtitle="Slide to choose your amount and tenor. We'll show you exactly what you'll pay back — no surprises." />
        <LoanCalculator />
      </section>

      {/* How it works */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="How it works" title="From application to disbursement in 10 minutes" />
          <div className="relative mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.n} style={{ animationDelay: `${i * 100}ms` }} className="relative rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">{s.n}</div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader align="left" eyebrow="Eligibility" title="Who can apply?" subtitle="Simple requirements designed for inclusion, not exclusion." />
            <ul className="mt-6 space-y-3">
              {eligibility.map((e, i) => (
                <li key={e} style={{ animationDelay: `${i * 60}ms` }} className="flex items-start gap-3 animate-fade-in-up">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15"><Check className="h-3.5 w-3.5 text-success" /></div>
                  <span className="text-sm">{e}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup"><Button size="lg" className="mt-8 gap-2 group">Check my eligibility <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
          </div>
          <div className="rounded-3xl border bg-card p-8 shadow-card hover-lift">
            <FileCheck className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-bold">Responsible lending pledge</h3>
            <p className="mt-3 text-muted-foreground">
              We're proud members of the Money Lenders Association of Nigeria. We never charge predatory rates,
              never share your data with shamers, and always offer hardship plans if life happens.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-accent p-3"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-2 font-semibold">Fair rates</p><p className="text-xs text-muted-foreground">From 4% / month</p></div>
              <div className="rounded-xl bg-accent p-3"><Users className="h-4 w-4 text-primary" /><p className="mt-2 font-semibold">No shaming</p><p className="text-xs text-muted-foreground">Privacy first</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
