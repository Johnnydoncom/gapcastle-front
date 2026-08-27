"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Smartphone, Wifi, Tv, Zap, Globe, GraduationCap, Shield,
  ArrowRight, Gift, Lock, Zap as Bolt, Check, ShieldCheck, CreditCard,
  Clock, Sparkles, BadgeCheck, Banknote, Receipt, Headphones, Star, TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import aboutTeaserImg from "@/assets/about-teaser.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const services = [
  { icon: Smartphone, label: "Airtime", desc: "All networks", tone: "from-blue-500/10 to-blue-500/0 text-blue-600" },
  { icon: Wifi, label: "Data Bundles", desc: "Cheapest rates", tone: "from-purple-500/10 to-purple-500/0 text-purple-600" },
  { icon: Tv, label: "Cable TV", desc: "DSTV, GOTV, Startimes", tone: "from-pink-500/10 to-pink-500/0 text-pink-600" },
  { icon: Zap, label: "Electricity", desc: "All discos", tone: "from-amber-500/10 to-amber-500/0 text-amber-600" },
  { icon: Globe, label: "Internet", desc: "Spectranet, Smile", tone: "from-cyan-500/10 to-cyan-500/0 text-cyan-600" },
  { icon: Receipt, label: "Collections", desc: "Agency & levies", tone: "from-orange-500/10 to-orange-500/0 text-orange-600" },
  { icon: GraduationCap, label: "Education", desc: "WAEC, JAMB, NECO", tone: "from-emerald-500/10 to-emerald-500/0 text-emerald-600" },
  { icon: Shield, label: "Insurance", desc: "Pay your premiums", tone: "from-indigo-500/10 to-indigo-500/0 text-indigo-600" },
];

const features = [
  { icon: ShieldCheck, title: "Secure Payment Gateways", text: "Bank-grade encryption protects every transaction. Your data and money stay safe, always." },
  { icon: CreditCard, title: "Multiple Payment Options", text: "Pay with cards, bank transfer, or wallet balance — whichever fits your moment." },
  { icon: Sparkles, title: "User-Friendly Interface", text: "Designed for everyone. Pay any bill in three taps, no banking jargon." },
  { icon: Clock, title: "24/7 Availability", text: "Bills don't keep office hours. Neither do we. Pay anytime, day or night." },
  { icon: Gift, title: "Amazing Cashback", text: "Earn up to 2% back on every transaction. Real money, instantly credited." },
  { icon: Bolt, title: "Instant Recharge", text: "Most transactions confirm in under 5 seconds. Your service is back up immediately." },
];

const steps = [
  { n: "01", title: "Create a free account", text: "Sign up in under a minute with your email or phone — no paperwork, no waiting." },
  { n: "02", title: "Fund your wallet", text: "Top up via card or bank transfer. Or pay one-off without funding at all." },
  { n: "03", title: "Pick a service", text: "Airtime, data, electricity, cable TV, education — all major billers in one place." },
  { n: "04", title: "Enter biller details", text: "Phone number, meter number, smartcard ID — we auto-detect your network and provider." },
  { n: "05", title: "Confirm with PIN", text: "Review and approve. Your bill is paid and cashback lands in your wallet." },
  { n: "06", title: "Track everything", text: "Receipts, history, and rewards in one dashboard. Re-pay any bill in one tap." },
];

const testimonials = [
  { name: "Charles Appiah", city: "Accra, Ghana", quote: "I've been using GapCastle for all my transactions. Fast, secure, and so easy to use — an absolute game-changer." },
  { name: "Jane Alex", city: "Surrey, UK", quote: "Sending and receiving money is so fast and I never worry about security. Definitely the best financial service I've used." },
  { name: "Tomi Adeleye", city: "Ibadan, Nigeria", quote: "GapCastle has completely transformed how I manage my payments. Quick, secure, and reliable — highly recommend." },
  { name: "Jerry Uche", city: "Lagos, Nigeria", quote: "The app is intuitive and works perfectly every time. The future of mobile financial services in Nigeria." },
];

const faqs = [
  { q: "How do I create an account?", a: "Click 'Get started' on the homepage and fill in your name, email, and a password. You'll be in within a minute — no paperwork." },
  { q: "How do I pay a bill?", a: "Log in, pick the service category (airtime, data, electricity, etc.), enter the biller details, confirm with your PIN, and you're done." },
  { q: "What payment methods are accepted?", a: "We accept debit cards, bank transfers, and your GapCastle wallet balance. Choose whichever you prefer at checkout." },
  { q: "Are my payment details secure?", a: "Yes. We use industry-standard encryption and never store your card details on our servers. Every transaction is processed through a PCI-compliant gateway." },
  { q: "How long does a payment take?", a: "Most payments are instant. Bank-transfer top-ups can take a few minutes, and a small number of biller settlements may take up to a few hours." },
  { q: "Can I schedule recurring payments?", a: "Yes — set up auto-pay for any bill. You choose the frequency and start date, and you can pause or cancel anytime." },
];

export default function Landing() {
  return (
    <>
      {/* Hero — premium fintech, phone mockup, ambient glow */}
      <section className="relative overflow-hidden">
        {/* layered backdrop blending with header */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-secondary/40" />
        <div className="absolute inset-0 -z-10 hero-grid opacity-50" />
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-40 -z-10 h-96 w-96 rounded-full bg-primary-glow/15 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-80 w-80 rounded-full bg-accent/60 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

        <div className="container grid gap-14 py-16 lg:grid-cols-12 lg:gap-10 lg:py-24 lg:items-center">
          {/* LEFT — copy */}
          <div className="space-y-7 animate-fade-in-up lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 backdrop-blur px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-ping opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Earn cashback on every transaction
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </div>

            <h1 className="text-4xl font-bold leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
              Streamline your <span className="gradient-text">utility bills</span> & VTU purchases
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Your bridge to financial gap. Pay airtime, data, cable TV, electricity, internet,
              education and insurance bills in seconds — and earn cashback on every payment.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/signup"><Button size="lg" className="gap-2 group shadow-elegant">Get started free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
              <Link href="/features"><Button size="lg" variant="outline">Explore features</Button></Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Bank-grade security</div>
              <div className="flex items-center gap-2"><Bolt className="h-4 w-4 text-primary" /> Avg. 4.2s delivery</div>
              <div className="flex items-center gap-2 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning" />)} <span className="text-muted-foreground">4.8 / 5</span></div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur">
              {[
                { v: "10k+", l: "Happy users" },
                { v: "₦500M+", l: "Bills processed" },
                { v: "200+", l: "Verified billers" },
              ].map((s) => (
                <div key={s.l} className="px-3 first:pl-0 last:pr-0">
                  <p className="text-2xl font-bold gradient-text">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — phone mockup with floating cards */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto h-[600px] w-[300px] sm:h-[640px] sm:w-[320px]">
              {/* ambient glow */}
              <div className="absolute -inset-12 -z-10 rounded-full bg-gradient-to-br from-primary/25 via-primary-glow/15 to-transparent blur-3xl" />
              {/* concentric rings */}
              <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
              <div className="absolute left-1/2 top-1/2 -z-10 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5" />

              {/* Phone frame */}
              <div className="relative h-full w-full rounded-[3rem] border border-border/80 bg-foreground p-3 shadow-elegant animate-float">
                <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-card">
                  {/* Notch */}
                  <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground" />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold">
                    <span>9:41</span>
                    <span className="opacity-60">●●●●● 5G</span>
                  </div>

                  {/* App content */}
                  <div className="px-4 pt-6">
                    {/* Greeting */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Good morning</p>
                        <p className="text-sm font-bold">Tomi A.</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">TA</div>
                    </div>

                    {/* Wallet */}
                    <div className="relative mt-4 overflow-hidden rounded-2xl gradient-hero p-4 text-primary-foreground shadow-elegant">
                      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Wallet balance</p>
                      <p className="mt-1 text-2xl font-bold">₦248,500<span className="opacity-70">.00</span></p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold">+ Top up</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold">↗ Transfer</span>
                      </div>
                    </div>

                    {/* Quick services */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[
                        { Icon: Smartphone, label: "Airtime" },
                        { Icon: Wifi, label: "Data" },
                        { Icon: Tv, label: "Cable" },
                        { Icon: Zap, label: "Power" },
                      ].map(({ Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1 rounded-xl border bg-background/60 py-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-[9px] font-medium">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Activity */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-muted-foreground">Activity</p>
                        <p className="text-[10px] font-semibold text-primary">See all</p>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { Icon: Smartphone, t: "MTN Airtime", s: "Today", a: "-₦2,000" },
                          { Icon: Zap, t: "EKEDC Power", s: "Yesterday", a: "-₦5,500" },
                          { Icon: Tv, t: "DSTV Premium", s: "Mon", a: "-₦37,000" },
                        ].map((r, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border bg-background/60 p-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                <r.Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold leading-tight">{r.t}</p>
                                <p className="text-[9px] text-muted-foreground leading-tight">{r.s}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold">{r.a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards around phone */}
              <div className="absolute -left-16 top-24 z-20 hidden rounded-2xl border bg-card/95 backdrop-blur p-3 shadow-elegant md:flex items-center gap-3 animate-float" style={{ animationDelay: "0.6s" }}>
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
                  <span className="absolute inset-0 rounded-full bg-success/30 animate-pulse-ring" />
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold leading-tight">Payment successful</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">+₦105 cashback</p>
                </div>
              </div>

              <div className="absolute -right-12 top-44 z-20 hidden rounded-2xl border bg-card/95 backdrop-blur p-3 shadow-elegant md:flex items-center gap-3 animate-float" style={{ animationDelay: "1.4s" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground"><Bolt className="h-4 w-4" /></div>
                <div>
                  <p className="text-[11px] font-semibold leading-tight">Instant delivery</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Avg. 4.2s</p>
                </div>
              </div>

              <div className="absolute -right-8 bottom-20 z-20 hidden rounded-2xl border bg-card/95 backdrop-blur p-3 shadow-elegant md:flex items-center gap-3 animate-float" style={{ animationDelay: "2.2s" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning"><Gift className="h-4 w-4" /></div>
                <div>
                  <p className="text-[11px] font-semibold leading-tight">Reward unlocked</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">+250 points</p>
                </div>
              </div>

              <div className="absolute -left-10 bottom-32 z-20 hidden rounded-full border bg-card/95 backdrop-blur px-3 py-1.5 shadow-elegant md:flex items-center gap-2 animate-float" style={{ animationDelay: "1.8s" }}>
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span className="text-[10px] font-semibold">PCI-DSS secured</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by marquee */}
      <section className="border-y bg-card py-6 overflow-hidden">
        <div className="flex animate-marquee gap-16 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {[...Array(2)].flatMap((_, i) => ["MTN", "Airtel", "Glo", "9mobile", "DSTV", "GOTV", "Ikeja Electric", "EKEDC", "Spectranet", "Smile", "WAEC", "JAMB"].map((n) => (
            <span key={`${i}-${n}`} className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" />{n}</span>
          )))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="Services" title="Every bill. One app." subtitle="Top up, subscribe, and pay across all major Nigerian providers — telcos, discos, cable TV, exam bodies and more." />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {services.map(({ icon: Icon, label, desc, tone }, i) => (
              <div key={label} style={{ animationDelay: `${i * 60}ms` }} className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-elegant animate-fade-in-up">
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${tone} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 font-semibold">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <SectionHeader eyebrow="Why GapCastle" title="Our special features" subtitle="The perfect solution for bill payments, loans, airtime, data, money management — and more — at your fingertips." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={{ animationDelay: `${i * 70}ms` }} className="group relative rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <div className="absolute -top-3 -right-3 h-20 w-20 rounded-full gradient-primary opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative rounded-3xl overflow-hidden border shadow-card">
            <img
              src={aboutTeaserImg.src}
              alt="GapCastle user enjoying seamless payments"
              className="w-full h-full object-cover"
              loading="lazy"
              width={1024}
              height={1024}
            />
          </div>
          <div>
            <SectionHeader align="left" eyebrow="About us" title={<>Empowering convenient utility bill payments, loans, VTU solutions and more</>} />
            <p className="mt-4 text-muted-foreground">
              At GapCastle, we've revolutionized the way you pay utility bills, handle loan needs, settle airtime
              and data bundle needs, manage expenses, and access business advisory.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about"><Button className="gap-2 group">Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
              <Link href="/loans"><Button variant="outline">Explore loans</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <SectionHeader eyebrow="How it works" title="Pay any bill in six simple steps" subtitle="Bill payment is a fundamental financial activity. Here's how easy GapCastle makes it." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(({ n, title, text }, i) => (
            <div key={n} style={{ animationDelay: `${i * 70}ms` }} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <span className="absolute -top-2 right-4 text-7xl font-black text-primary/10 transition-all duration-300 group-hover:text-primary/20 group-hover:-translate-y-1">{n}</span>
              <h3 className="relative mt-2 text-lg font-semibold">{title}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="container py-12">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-primary-foreground md:p-16">
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="text-3xl font-bold md:text-4xl">Ready to bridge the gap?</h3>
              <p className="mt-3 max-w-lg opacity-90">Join 10,000+ Nigerians paying bills smarter, faster and with rewards on every transaction.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/signup"><Button size="lg" variant="secondary" className="gap-2">Create free account <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/contact"><Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20">Talk to sales</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20">
        <SectionHeader eyebrow="Testimonials" title="What our clients say" subtitle="Trusted by individuals and businesses across Nigeria, Ghana and the UK." />
        <Carousel
          opts={{ align: "start", loop: true }}
          className="mt-12 w-full"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((t) => (
              <CarouselItem key={t.name} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card hover-lift">
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}</div>
                  <blockquote className="mt-3 flex-1 text-sm text-muted-foreground">"{t.quote}"</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.city}</p>
                    </div>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
          <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12" />
          <CarouselNext className="hidden md:flex -right-4 lg:-right-12" />
        </Carousel>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" subtitle="Quick answers to the questions we hear most often." />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="overflow-hidden rounded-2xl border bg-card px-5 shadow-card">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
