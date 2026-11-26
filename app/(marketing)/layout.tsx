import Link from "next/link";
import { MarketingHeader } from "@/components/MarketingHeader";
import { AppStoreButtons } from "@/components/AppStoreButtons";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <MarketingHeader />

      <main id="main" className="animate-fade-in flex-1">{children}</main>

      <footer className="relative mt-20 overflow-hidden border-t bg-secondary/30">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-40" />
        <div className="container py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground max-w-sm">
                {SITE.name} is your bridge to financial gap — a smarter way to pay bills, manage VTU,
                access quick loans and grow your business across Nigeria.
              </p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Download the app</p>
                <AppStoreButtons />
              </div>
            </div>
            <nav aria-label="Company">
              <h2 className="text-sm font-semibold">Company</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/loans" className="hover:text-foreground">Loans</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </nav>
            <div>
              <h2 className="text-sm font-semibold">Services</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Airtime & Data</li>
                <li>Cable TV & Electricity</li>
                <li>Internet & Education</li>
                <li>Insurance & Loans</li>
                <li>Water, Gas & Collections</li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Get in touch</h2>
              <address className="mt-4 space-y-3 text-sm not-italic text-muted-foreground">
                <p className="flex items-start gap-2"><Mail aria-hidden className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><a href={`mailto:${SITE.email}`} className="hover:text-foreground">{SITE.email}</a></p>
                <p className="flex items-start gap-2"><Phone aria-hidden className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><a href={`tel:${SITE.phone.e164}`} className="hover:text-foreground">{SITE.phone.display}</a></p>
                <p className="flex items-start gap-2"><MessageCircle aria-hidden className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Chat on WhatsApp</a></p>
                <p className="flex items-start gap-2"><MapPin aria-hidden className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{SITE.address.full}</a></p>
              </address>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
