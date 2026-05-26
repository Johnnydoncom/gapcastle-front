"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/loans", label: "Loans" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled ? "glass border-b shadow-card" : "bg-transparent"
    )}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="transition-transform hover:scale-105"><Logo /></Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cn(
              "story-link transition-colors hover:text-foreground",
              isActive && "text-foreground"
            )}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block"><Button variant="ghost">Sign in</Button></Link>
          <Link href="/signup"><Button className="gap-2 group">Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t bg-card animate-fade-in">
          <div className="container flex flex-col py-3">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
              )}>{l.label}</NavLink>
            ))}
            <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary sm:hidden">Sign in</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
