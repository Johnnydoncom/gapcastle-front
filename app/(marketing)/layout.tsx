import Link from "next/link";
import { MarketingHeader } from "@/components/MarketingHeader";
import { AppStoreButtons } from "@/components/AppStoreButtons";
import { Logo } from "@/components/Logo";
import { Mail, Phone, MapPin } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingHeader />

      <main className="animate-fade-in flex-1">{children}</main>

      <footer className="relative mt-20 overflow-hidden border-t bg-secondary/30">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-40" />
        <div className="container py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground max-w-sm">
                GapCastle is your bridge to financial gap — a smarter way to pay bills, manage VTU,
                access micro-loans and grow your business across Nigeria and beyond.
              </p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Download the app</p>
                <AppStoreButtons />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/loans" className="hover:text-foreground">Loans</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Services</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Airtime & Data</li>
                <li>Cable TV & Electricity</li>
                <li>Internet & Education</li>
                <li>Insurance & Loans</li>
                <li>Water, Gas & Collections</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Get in touch</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-primary" /> hello@gapcastle.com</li>
                <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary" /> +234 800 GAPCASTLE</li>
                <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary" /> Victoria Island, Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} GapCastle Technologies Ltd. All rights reserved.</p>
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
