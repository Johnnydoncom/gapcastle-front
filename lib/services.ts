/**
 * UI metadata for bill services, keyed by backend slug.
 * The backend API (`GET /api/v1/services`) is the single source of truth
 * for which services are active. This map only enriches API-returned slugs
 * with icon, colour, and route information for display purposes.
 *
 * Add a new entry here whenever a new service is added in the backend.
 */
export const SERVICE_UI_MAP: Record<string, {
  icon: string;
  color: string;
  href: string;
  label: string;
  description: string;
}> = {
  airtime:      { icon: "Smartphone",    color: "bg-blue-50 text-blue-600",     href: "airtime",      label: "Airtime",          description: "Top up any network" },
  data:         { icon: "Wifi",          color: "bg-purple-50 text-purple-600", href: "data",          label: "Data Bundles",     description: "Buy mobile data" },
  cable:        { icon: "Tv",            color: "bg-pink-50 text-pink-600",     href: "cable",         label: "Cable TV",         description: "DSTV, GOTV, Startimes" },
  electricity:  { icon: "Zap",           color: "bg-yellow-50 text-yellow-700", href: "electricity",   label: "Electricity",      description: "Pay power bills" },
  internet:     { icon: "Globe",         color: "bg-cyan-50 text-cyan-600",     href: "internet",      label: "Internet",         description: "Spectranet, Smile, Swift" },
  pin:          { icon: "Ticket",        color: "bg-orange-50 text-orange-600", href: "recharge-pin",  label: "Recharge PINs",    description: "Buy airtime vouchers" },
  education:    { icon: "GraduationCap", color: "bg-emerald-50 text-emerald-600", href: "education",   label: "Education",        description: "WAEC, JAMB, NECO" },
  insurance:    { icon: "Shield",        color: "bg-indigo-50 text-indigo-600", href: "insurance",     label: "Insurance",        description: "Pay your premiums" },
  gas:          { icon: "Flame",         color: "bg-rose-50 text-rose-600",     href: "gas",           label: "Gas",              description: "Pay for cooking gas" },
  water:        { icon: "Droplets",      color: "bg-cyan-50 text-cyan-600",     href: "water",         label: "Water",            description: "Pay water bills" },
  collection:   { icon: "Briefcase",     color: "bg-slate-50 text-slate-600",   href: "collection",    label: "Collections",      description: "Agency & tax collections" },
  kyc:          { icon: "UserCheck",     color: "bg-teal-50 text-teal-600",     href: "kyc",           label: "KYC Verification", description: "Identity verification" },
  credit_check: { icon: "FileSearch",    color: "bg-violet-50 text-violet-600", href: "credit-check",  label: "Credit Check",     description: "Check credit history" },
};

/**
 * Returns UI metadata for a service slug, with safe fallbacks for any
 * backend service that does not yet have a local entry.
 */
export const getServiceUi = (slug: string) =>
  SERVICE_UI_MAP[slug] ?? {
    icon: "CircleDollarSign",
    color: "bg-slate-50 text-slate-600",
    href: slug,
    label: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "",
  };

// ─── Legacy export kept for pages that haven't yet migrated ──────────────────
/** @deprecated Use `useServices()` hook + `getServiceUi()` instead. */
export const SERVICE_CATEGORIES = [
  { slug: "airtime",      href: "airtime",      label: "Airtime",          icon: "Smartphone",    description: "Top up any network",       color: "bg-blue-50 text-blue-600" },
  { slug: "data",         href: "data",         label: "Data Bundles",     icon: "Wifi",          description: "Buy mobile data",          color: "bg-purple-50 text-purple-600" },
  { slug: "cable",        href: "cable",        label: "Cable TV",         icon: "Tv",            description: "DSTV, GOTV, Startimes",   color: "bg-pink-50 text-pink-600" },
  { slug: "electricity",  href: "electricity",  label: "Electricity",      icon: "Zap",           description: "Pay power bills",          color: "bg-yellow-50 text-yellow-700" },
  { slug: "internet",     href: "internet",     label: "Internet",         icon: "Globe",         description: "Spectranet, Smile, Swift", color: "bg-cyan-50 text-cyan-600" },
  { slug: "pin",          href: "recharge-pin", label: "Recharge PINs",    icon: "Ticket",        description: "Buy airtime vouchers",     color: "bg-orange-50 text-orange-600" },
  { slug: "education",    href: "education",    label: "Education",        icon: "GraduationCap", description: "WAEC, JAMB, NECO",         color: "bg-emerald-50 text-emerald-600" },
  { slug: "insurance",    href: "insurance",    label: "Insurance",        icon: "Shield",        description: "Pay your premiums",        color: "bg-indigo-50 text-indigo-600" },
  { slug: "gas",          href: "gas",          label: "Gas",              icon: "Flame",         description: "Pay for cooking gas",      color: "bg-rose-50 text-rose-600" },
  { slug: "water",        href: "water",        label: "Water",            icon: "Droplets",      description: "Pay water bills",          color: "bg-cyan-50 text-cyan-600" },
  { slug: "collection",   href: "collection",   label: "Collections",      icon: "Briefcase",     description: "Agency & tax collections", color: "bg-slate-50 text-slate-600" },
  { slug: "kyc",          href: "kyc",          label: "KYC Verification", icon: "UserCheck",     description: "Identity verification",    color: "bg-teal-50 text-teal-600" },
  { slug: "credit_check", href: "credit-check", label: "Credit Check",     icon: "FileSearch",    description: "Check credit history",     color: "bg-violet-50 text-violet-600" },
] as const;

export type ServiceSlug = keyof typeof SERVICE_UI_MAP;

export const getCategory = (slug: string) => SERVICE_CATEGORIES.find((c) => c.slug === slug);
