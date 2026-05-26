"use client";
import { useState } from "react";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, MessageCircle, Headphones, Building2, Send, Clock, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const channels = [
  { icon: MessageCircle, title: "Live chat", text: "Fastest way to reach us. Average response: 2 minutes.", action: "Chat now", meta: "24/7" },
  { icon: Mail, title: "Email", text: "For detailed questions and account-specific support.", action: "hello@gapcastle.com", meta: "Reply in 4 hrs" },
  { icon: Phone, title: "Phone", text: "Speak to a real person about complex issues or business enquiries.", action: "+234 800 GAPCASTLE", meta: "Mon–Sat, 8AM–8PM" },
  { icon: Building2, title: "Visit us", text: "Drop by our Lagos HQ for partnership and enterprise conversations.", action: "Plot 15B Adeola Odeku, Victoria Island", meta: "By appointment" },
];

const faqs = [
  { q: "How quickly will I get a response?", a: "Live chat: under 2 minutes. Email: under 4 hours during business days. Phone: instant during business hours." },
  { q: "I have a transaction dispute. What do I do?", a: "Open the failed transaction in your Transactions tab and tap 'Report issue'. Our team auto-receives the full context and responds within 30 minutes." },
  { q: "Do you offer enterprise/API access?", a: "Yes. We offer bulk-payout, VTU resale and embedded-finance APIs for businesses processing 1,000+ transactions monthly. Use the form below or email partners@gapcastle.com." },
  { q: "Are you hiring?", a: "Always. Visit careers.gapcastle.com for open roles in engineering, design, ops and growth." },
];

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast({ title: "Message received", description: "We'll get back to you within 4 hours." });
    }, 800);
  };

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={<>We're here to <span className="gradient-text">help, always</span></>}
        subtitle="Real Nigerians answering chat, email and phone. No bots. No scripts. No 14-step IVR menus."
      />

      {/* Channels */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: Icon, title, text, action, meta }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="group rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary transition-transform group-hover:rotate-6 group-hover:scale-110">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <p className="mt-3 text-sm font-semibold text-primary">{action}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{meta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + map */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="rounded-3xl border bg-card p-8 shadow-card animate-fade-in-up">
            <SectionHeader align="left" eyebrow="Send a message" title="We'd love to hear from you" />
            {done ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-success/10 p-10 text-center animate-scale-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Message sent!</h3>
                <p className="mt-2 text-sm text-muted-foreground">A real human will reply within 4 hours.</p>
                <Button variant="ghost" className="mt-4" onClick={() => setDone(false)}>Send another</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" required placeholder="Adaeze Okafor" /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required placeholder="you@example.com" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" required placeholder="How can we help?" /></div>
                <div className="space-y-2"><Label htmlFor="msg">Message</Label><Textarea id="msg" required rows={5} placeholder="Tell us a little about your enquiry…" /></div>
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? "Sending…" : <>Send message <Send className="h-4 w-4" /></>}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-8 shadow-card animate-fade-in-up">
              <Headphones className="h-8 w-8 text-primary" />
              <h3 className="mt-3 text-xl font-bold">Support hours</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Live chat</span><span className="font-semibold">24 / 7</span></li>
                <li className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Phone</span><span className="font-semibold">Mon–Sat, 8AM–8PM WAT</span></li>
                <li className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-semibold">Replies in 4 hours</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Office visits</span><span className="font-semibold">Mon–Fri, by appointment</span></li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl border bg-card shadow-card animate-fade-in-up">
              <div className="aspect-video w-full">
                <iframe
                  title="GapCastle HQ map"
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=Victoria+Island+Lagos&output=embed"
                />
              </div>
              <div className="flex items-start gap-3 p-6">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">GapCastle HQ</p>
                  <p className="text-sm text-muted-foreground">Plot 15B Adeola Odeku Street, Victoria Island, Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-20">
        <SectionHeader eyebrow="Quick answers" title="Before you reach out" subtitle="A few of the most common questions, answered." />
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
      </section>
    </>
  );
}
