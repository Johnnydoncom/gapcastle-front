"use client";
import Link from "next/link";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Users, Globe2, Award, TrendingUp, ArrowRight, ShieldCheck, Sparkles, Handshake } from "lucide-react";

const values = [
  { icon: ShieldCheck, title: "Trust", text: "We treat every naira like our own — protected by bank-grade security and transparent pricing." },
  { icon: Sparkles, title: "Simplicity", text: "Banking shouldn't be confusing. We build experiences your grandmother could use." },
  { icon: Handshake, title: "Inclusion", text: "From students to SMEs, everyone deserves access to modern financial tools." },
  { icon: TrendingUp, title: "Innovation", text: "We ship faster than legacy banks can write a memo. Always improving, always listening." },
];

const milestones = [
  { year: "2021", title: "Founded in Lagos", text: "GapCastle began as a simple VTU platform serving university students." },
  { year: "2022", title: "10,000 users", text: "Crossed our first major milestone with users across 30 Nigerian states." },
  { year: "2023", title: "Multi-service launch", text: "Expanded to electricity, cable TV, internet, and exam payments." },
  { year: "2024", title: "₦500M+ processed", text: "Half a billion naira in bills processed — and counting." },
  { year: "2025", title: "Loans & rewards", text: "Launched micro-loans and our 2% cashback program for loyal users." },
  { year: "2026", title: "Pan-African vision", text: "Expanding to Ghana and East Africa to bridge financial gaps continent-wide." },
];

const team = [
  { name: "Adaeze Okafor", role: "CEO & Co-founder", initials: "AO" },
  { name: "Ibrahim Yusuf", role: "CTO & Co-founder", initials: "IY" },
  { name: "Tunde Bakare", role: "Head of Product", initials: "TB" },
  { name: "Chiamaka Eze", role: "Head of Operations", initials: "CE" },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About GapCastle"
        title={<>Bridging the gap between <span className="gradient-text">people and finance</span></>}
        subtitle="We're a Nigerian fintech on a mission to make everyday financial services effortless — from paying your light bill to growing your business."
      >
        <Link href="/signup"><Button size="lg" className="gap-2 group">Join the journey <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
        <Link href="/contact"><Button size="lg" variant="outline">Get in touch</Button></Link>
      </PageHero>

      {/* Mission / Vision */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", text: "To empower every Nigerian with seamless access to bill payments, credit and digital financial services — because convenience shouldn't be a luxury." },
            { icon: Eye, title: "Our Vision", text: "To become Africa's most trusted utility and VTU platform, serving 10 million users by 2030 across 15+ countries." },
            { icon: Heart, title: "Our Promise", text: "Fair pricing, instant delivery, real cashback and human support — every single time, for every single customer." },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={{ animationDelay: `${i * 100}ms` }} className="group rounded-2xl border bg-card p-8 shadow-card hover-lift animate-fade-in-up">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary transition-transform group-hover:rotate-6 group-hover:scale-110">
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader align="left" eyebrow="Our story" title="From a dorm-room idea to a national platform" />
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                GapCastle was born in 2021 from a simple frustration: paying for airtime, electricity and exam fees in Nigeria
                shouldn't require five different apps, three failed transactions and a trip to a kiosk.
              </p>
              <p>
                Our co-founders, Adaeze and Ibrahim, were university students juggling tuition fees and side hustles when they
                built the first version of GapCastle as a weekend project. Today, we serve thousands of Nigerians,
                students, market traders, and small business owners — bridging the gap between people and the financial services they deserve.
              </p>
              <p>
                We're independently funded, profitably growing, and proudly Nigerian. Every feature we ship is built with one
                question in mind: <em className="text-foreground">does this make life easier for our users?</em>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "10k+", l: "Active users", icon: Users },
              { v: "₦500M+", l: "Processed", icon: TrendingUp },
              { v: "200+", l: "Verified billers", icon: Award },
              { v: "3", l: "Countries served", icon: Globe2 },
            ].map(({ v, l, icon: Icon }, i) => (
              <div key={l} style={{ animationDelay: `${i * 80}ms` }} className="rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-4 text-3xl font-bold gradient-text">{v}</p>
                <p className="text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container py-20">
        <SectionHeader eyebrow="Our values" title="What we believe in" subtitle="Four principles that guide every product decision and every customer interaction." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container">
          <SectionHeader eyebrow="Our journey" title="Five years of bridging gaps" />
          <div className="relative mx-auto mt-12 max-w-4xl">
            <div className="absolute left-4 top-0 h-full w-px bg-border md:left-1/2" />
            {milestones.map((m, i) => (
              <div key={m.year} style={{ animationDelay: `${i * 100}ms` }} className={`relative mb-8 flex animate-fade-in-up md:mb-12 ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                  <div className="rounded-2xl border bg-card p-6 shadow-card hover-lift">
                    <p className="text-sm font-bold text-primary">{m.year}</p>
                    <h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                  </div>
                </div>
                <span className="absolute left-4 top-6 -translate-x-1/2 md:left-1/2">
                  <span className="relative flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                    <span className="relative inline-flex h-4 w-4 rounded-full gradient-primary ring-4 ring-background" />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container py-20">
        <SectionHeader eyebrow="Leadership" title="Meet the team" subtitle="A tight-knit group of builders, designers and operators obsessed with making finance work for everyone." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {team.map((p, i) => (
            <div key={p.name} style={{ animationDelay: `${i * 80}ms` }} className="group rounded-2xl border bg-card p-6 text-center shadow-card hover-lift animate-fade-in-up">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground transition-transform group-hover:scale-110">
                {p.initials}
              </div>
              <h3 className="mt-4 font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.role}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
