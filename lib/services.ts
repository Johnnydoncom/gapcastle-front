export const SERVICE_CATEGORIES = [
  { slug: "airtime", href: "airtime", label: "Airtime", icon: "Smartphone", description: "Top up any network", color: "bg-blue-50 text-blue-600" },
  { slug: "data", href: "data", label: "Data Bundles", icon: "Wifi", description: "Buy mobile data", color: "bg-purple-50 text-purple-600" },
  { slug: "cable", href: "cable", label: "Cable TV", icon: "Tv", description: "DSTV, GOTV, Startimes", color: "bg-pink-50 text-pink-600" },
  { slug: "electricity", href: "electricity", label: "Electricity", icon: "Zap", description: "Pay power bills", color: "bg-yellow-50 text-yellow-700" },
  { slug: "internet", href: "internet", label: "Internet", icon: "Globe", description: "Spectranet, Smile, Swift", color: "bg-cyan-50 text-cyan-600" },
  { slug: "pin", href: "recharge-pin", label: "Recharge PINs", icon: "Ticket", description: "Buy airtime vouchers", color: "bg-orange-50 text-orange-600" },
  { slug: "education", href: "education", label: "Education", icon: "GraduationCap", description: "WAEC, JAMB, NECO", color: "bg-emerald-50 text-emerald-600" },
  { slug: "insurance", href: "insurance", label: "Insurance", icon: "Shield", description: "Pay your premiums", color: "bg-indigo-50 text-indigo-600" },
  { slug: "gas", href: "gas", label: "Gas", icon: "Flame", description: "Pay for cooking gas", color: "bg-rose-50 text-rose-600" },
  { slug: "water", href: "water", label: "Water", icon: "Droplets", description: "Pay water bills", color: "bg-cyan-50 text-cyan-600" },
  { slug: "collection", href: "collection", label: "Collections", icon: "Briefcase", description: "Agency & tax collections", color: "bg-slate-50 text-slate-600" },
  { slug: "kyc", href: "kyc", label: "KYC Verification", icon: "UserCheck", description: "Identity verification", color: "bg-teal-50 text-teal-600" },
  { slug: "credit_check", href: "credit-check", label: "Credit Check", icon: "FileSearch", description: "Check credit history", color: "bg-violet-50 text-violet-600" },
] as const;

export type ServiceSlug = typeof SERVICE_CATEGORIES[number]["slug"];

export const getCategory = (slug: string) => SERVICE_CATEGORIES.find(c => c.slug === slug);
