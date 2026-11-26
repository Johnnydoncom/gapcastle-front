import type { Metadata } from "next";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/marketing/FaqList";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Mail, Phone, MapPin, MessageCircle, Headphones, Building2, Clock } from "lucide-react";
import { SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/structured-data";

const CONTACT_TITLE = "Contact Us — Phone, Email, WhatsApp & Ikeja Office";
const CONTACT_DESCRIPTION = `Contact Gap Castle on ${SITE.phone.display}, email ${SITE.email}, chat on WhatsApp or visit our office at ${SITE.address.full}. Open ${SITE.hours.short}.`;

export const metadata: Metadata = pageMetadata({ title: CONTACT_TITLE, description: CONTACT_DESCRIPTION, path: "/contact" });

const channels = [
  { icon: Mail, title: "Email", text: "For detailed questions and account-specific support.", action: SITE.email, href: `mailto:${SITE.email}`, meta: SITE.hours.short, external: false },
  { icon: Phone, title: "Phone", text: "Speak to a real person about complex issues or business enquiries.", action: SITE.phone.display, href: `tel:${SITE.phone.e164}`, meta: SITE.hours.short, external: false },
  { icon: MessageCircle, title: "WhatsApp", text: "Chat with our support team from your phone.", action: "Chat on WhatsApp", href: SITE.whatsappUrl, meta: "Fastest replies during working hours", external: true },
  { icon: Building2, title: "Visit us", text: "Drop by our Ikeja office for partnership and enterprise conversations.", action: SITE.address.full, href: SITE.mapUrl, meta: SITE.hours.short, external: true },
];

const faqs = [
  { q: "What are your opening hours?", a: `We are open ${SITE.hours.weekdays}, and closed at weekends and on public holidays. Payments on the app work 24/7.` },
  { q: "How quickly will I get a response?", a: `Phone, email and WhatsApp messages are answered during business hours, ${SITE.hours.short}. WhatsApp is usually the fastest way to reach us.` },
  { q: "Where is the Gap Castle office?", a: `Our office is at ${SITE.address.full}, Nigeria. Visits are welcome during business hours, ${SITE.hours.short}.` },
  { q: "I have a transaction dispute. What do I do?", a: `Open the transaction in your Transactions tab and tap 'Report issue' so our team gets the full context, or email ${SITE.email} with your transaction reference.` },
  { q: "Do you offer enterprise/API access?", a: `Yes. We offer bulk-payout, VTU resale and embedded-finance APIs for businesses processing 1,000+ transactions monthly. Use the form on this page or email ${SITE.email}.` },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ type: "ContactPage", name: CONTACT_TITLE, description: CONTACT_DESCRIPTION, path: "/contact" }),
          breadcrumbSchema([{ name: "Contact", path: "/contact" }]),
          faqSchema(faqs),
        ]}
      />
      <PageHero
        eyebrow="Contact us"
        title={<>We&apos;re here to <span className="gradient-text">help</span></>}
        subtitle={`Real people answering WhatsApp, email and phone, ${SITE.hours.short}. No bots. No scripts. No 14-step IVR menus.`}
      />

      {/* Channels */}
      <section className="container py-20" aria-label="Ways to reach us">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: Icon, title, text, action, href, meta, external }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="group rounded-2xl border bg-card p-6 shadow-card hover-lift animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary transition-transform group-hover:rotate-6 group-hover:scale-110">
                <Icon aria-hidden className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-3 block text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {action}
              </a>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock aria-hidden className="h-3 w-3" />{meta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + map */}
      <section className="border-y bg-secondary/30 py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="rounded-3xl border bg-card p-8 shadow-card animate-fade-in-up">
            <SectionHeader align="left" eyebrow="Send a message" title="We'd love to hear from you" />
            <ContactForm email={SITE.email} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-8 shadow-card animate-fade-in-up">
              <Headphones aria-hidden className="h-8 w-8 text-primary" />
              <h2 className="mt-3 text-xl font-bold">Support hours</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">Phone</span><span className="font-semibold">{SITE.hours.short}</span></li>
                <li className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">Email & WhatsApp</span><span className="font-semibold">{SITE.hours.short}</span></li>
                <li className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">Office visits</span><span className="font-semibold">{SITE.hours.short}</span></li>
                <li className="flex justify-between gap-4"><span className="text-muted-foreground">Saturday & Sunday</span><span className="font-semibold">Closed</span></li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl border bg-card shadow-card animate-fade-in-up">
              <div className="aspect-video w-full">
                <iframe
                  title={`Map of the ${SITE.name} office in Ikeja, Lagos`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={SITE.mapEmbedUrl}
                />
              </div>
              <div className="flex items-start gap-3 p-6">
                <MapPin aria-hidden className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{SITE.name} office</p>
                  <address className="text-sm not-italic text-muted-foreground">{SITE.address.full}, {SITE.address.countryName}</address>
                  <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">Get directions</a>
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
          <FaqList faqs={faqs} />
        </div>
      </section>
    </>
  );
}
