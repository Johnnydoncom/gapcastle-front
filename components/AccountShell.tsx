"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Wallet, Grid3x3, Receipt, Gift, Settings,
  LogOut, Menu, X, LifeBuoy, Phone, Wifi, Lightbulb, Tv,
  GraduationCap, ShieldCheck, Sparkles, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const mainNav = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard },
  { to: "/account/wallet", label: "Wallet", icon: Wallet },
  { to: "/account/transactions", label: "Transactions", icon: Receipt },
  { to: "/account/rewards", label: "Rewards", icon: Gift },
];

const servicesNav = [
  { to: "/account/airtime", label: "Buy Airtime", icon: Phone, color: "from-blue-400 to-blue-600" },
  { to: "/account/data", label: "Mobile Data", icon: Wifi, color: "from-emerald-400 to-emerald-600" },
  { to: "/account/electricity", label: "Electricity", icon: Lightbulb, color: "from-amber-400 to-orange-500" },
  { to: "/account/cable", label: "PayTV", icon: Tv, color: "from-purple-400 to-purple-600" },
  { to: "/account/internet", label: "Internet", icon: Wifi, color: "from-blue-400 to-blue-600" },
  { to: "/account/education", label: "Educational", icon: GraduationCap, color: "from-pink-400 to-rose-500" },
  { to: "/account/insurance", label: "Insurance", icon: ShieldCheck, color: "from-indigo-400 to-indigo-600" },
  { to: "/account/services", label: "All Services", icon: Grid3x3, color: "from-slate-400 to-slate-600" },
];

const generalNav = [
  { to: "/account/support", label: "Support Tickets", icon: LifeBuoy },
  { to: "/account/settings", label: "Account Settings", icon: Settings },
];

interface AccountShellProps {
  children: React.ReactNode;
  /** Seeded from the server session — auth is already guaranteed by the layout. */
  user?: { name?: string | null; email?: string | null };
}

export function AccountShell({ children, user }: AccountShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOut({ callbackUrl: "/" }); };

  const isPathActive = (to: string) => pathname === to || (to !== "/account" && !!pathname?.startsWith(to));

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const SideNavItem = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const Icon = item.icon;
    const active = isPathActive(item.to);

    return (
      <Link
        href={item.to}
        onClick={onClick}
        className={cn(
          "group relative flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-300 overflow-hidden",
          active
            ? "text-white"
            : "text-slate-300 hover:text-white"
        )}
      >
        {/* Active Background Glow */}
        {active && (
          <div className="absolute inset-0 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-xl" />
        )}

        {/* Hover Background */}
        {!active && (
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors rounded-xl" />
        )}

        <div className="relative flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[10px] transition-all duration-300 shadow-sm",
            active
              ? item.color
                ? cn("bg-gradient-to-br", item.color, "text-white shadow-md")
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25"
              : "bg-white/[0.08] text-slate-400 group-hover:bg-white/[0.12] group-hover:text-white"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="truncate tracking-wide">{item.label}</span>
        </div>

        {active && <ChevronRight className="relative h-4 w-4 text-white/50" />}
      </Link>
    );
  };

  const MobileNavItem = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const Icon = item.icon;
    const active = isPathActive(item.to);

    return (
      <Link
        href={item.to}
        onClick={onClick}
        className={cn(
          "group flex items-center justify-between rounded-xl px-2 py-1.5 text-[14px] font-semibold transition-all duration-200",
          active
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
            active
              ? item.color
                ? cn("bg-gradient-to-br", item.color, "text-white shadow-md")
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25"
              : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="truncate">{item.label}</span>
        </div>
        {active && <ChevronRight className="h-4 w-4 text-indigo-400" />}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">

      {/* ═══════════ Desktop Sidebar ═══════════ */}
      <aside className="hidden w-[280px] flex-col md:flex relative overflow-hidden bg-gradient-to-b from-[#0B0F19] to-[#111827]">

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-[300px] bg-gradient-to-tl from-blue-600/10 to-transparent blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 h-[70px] flex shrink-0 items-center px-6 py-1.5 border-b border-white/[0.05]">
          <Link href="/account" className="brightness-300 contrast-150 iinvert filter">
            <Logo />
          </Link>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">

          <div className="mb-8">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Overview
            </p>
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <SideNavItem key={item.to} item={item} />
              ))}
            </nav>
          </div>

          <div className="mb-8">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Buy Services
            </p>
            <nav className="space-y-1">
              {servicesNav.map((item) => (
                <SideNavItem key={item.to} item={item} />
              ))}
            </nav>
          </div>

          <div className="mb-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Account
            </p>
            <nav className="space-y-1">
              {generalNav.map((item) => (
                <SideNavItem key={item.to} item={item} />
              ))}
            </nav>
          </div>
        </div>

        {/* Promo Card */}
        <div className="relative z-10 px-4 pb-4">
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 border border-white/10 relative overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.15] rotate-12">
              <Gift className="h-24 w-24 text-white" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="text-[13px] font-bold text-white tracking-wide">Refer & Earn</p>
              </div>
              <p className="text-[11px] text-slate-300 mb-4 leading-relaxed font-medium">
                Invite friends and earn a ₦500 bonus for each successful referral.
              </p>
              <Button size="sm" className="w-full text-xs h-9 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 hover:text-indigo-900 font-bold shadow-lg transition-all hover:scale-[1.02]" asChild>
                <Link href="/account/rewards">Invite Friends</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="relative z-10 border-t border-white/[0.05] p-4 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/10">
                {userInitial}
              </div>
              <div className="truncate">
                <p className="truncate text-sm font-semibold text-white tracking-wide">{userName}</p>
                <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
              </div>
            </div>
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════ Mobile Header & Content ═══════════ */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-4 md:hidden sticky top-0 z-30 shadow-sm">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-md">
              {userInitial}
            </div>
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
            <nav className="relative w-full max-w-[300px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col custom-scrollbar">

              <div className="flex items-center h-[72px] px-6 py-1.5 border-b border-slate-100">
                <Logo />
              </div>

              <div className="flex-1 p-5">
                <div className="mb-8">
                  <h3 className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Overview</h3>
                  <div className="space-y-1.5">{mainNav.map(item => <MobileNavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />)}</div>
                </div>
                <div className="mb-8">
                  <h3 className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Buy Services</h3>
                  <div className="space-y-1.5">{servicesNav.map(item => <MobileNavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />)}</div>
                </div>
                <div className="mb-6">
                  <h3 className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Account</h3>
                  <div className="space-y-1.5">{generalNav.map(item => <MobileNavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />)}</div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
                <Button variant="outline" className="w-full h-11 rounded-xl justify-center text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold transition-colors shadow-sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out securely
                </Button>
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
