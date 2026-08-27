/**
 * Delivery display helpers for transaction receipts.
 *
 * Maps service_group slugs → contextual labels, icons, and colour schemes
 * so the receipt section shows "Electricity Token" instead of a generic
 * "Your Token / PIN" for every service.
 */

export interface DeliveryDisplayInfo {
  /** Human-readable label, e.g. "Electricity Token" */
  label: string;
  /** Lucide icon name to import/render */
  icon: "Zap" | "GraduationCap" | "Tv" | "Smartphone" | "ShieldCheck" | "Globe" | "Droplets" | "Flame" | "KeyRound";
  /** Tailwind colour key used for bg/text/border classes */
  color: "amber" | "emerald" | "blue" | "violet" | "sky" | "cyan" | "teal";
  /** Short description shown below the code */
  hint: string;
}

const displayMap: Record<string, DeliveryDisplayInfo> = {
  electricity: {
    label: "Electricity Token",
    icon: "Zap",
    color: "amber",
    hint: "Enter this token on your prepaid meter",
  },
  education: {
    label: "Exam PIN",
    icon: "GraduationCap",
    color: "emerald",
    hint: "Use this PIN on the exam portal",
  },
  cable: {
    label: "Subscription Code",
    icon: "Tv",
    color: "blue",
    hint: "Your subscription has been activated",
  },
  airtime: {
    label: "Recharge Code",
    icon: "Smartphone",
    color: "violet",
    hint: "Dial *126*code# or enter on your phone",
  },
  data: {
    label: "Data Activation Code",
    icon: "Smartphone",
    color: "violet",
    hint: "Your data bundle is now active",
  },
  insurance: {
    label: "Policy Reference",
    icon: "ShieldCheck",
    color: "teal",
    hint: "Keep this reference for your records",
  },
  internet: {
    label: "Subscription Code",
    icon: "Globe",
    color: "sky",
    hint: "Your internet plan has been activated",
  },
  water: {
    label: "Payment Token",
    icon: "Droplets",
    color: "cyan",
    hint: "Enter this token on your meter",
  },
  gas: {
    label: "Payment Token",
    icon: "Flame",
    color: "amber",
    hint: "Enter this token on your meter",
  },
};

const fallback: DeliveryDisplayInfo = {
  label: "Delivery Code",
  icon: "KeyRound",
  color: "emerald",
  hint: "Keep this code for your records",
};

/**
 * Get display metadata for the delivery result section of a receipt.
 */
export function getDeliveryDisplayInfo(serviceGroup: string | null | undefined): DeliveryDisplayInfo {
  if (!serviceGroup) return fallback;
  return displayMap[serviceGroup] ?? fallback;
}

/**
 * Format a token value for display.
 *
 * Accepts either a single string or an array of strings (e.g. multiple WAEC PINs
 * returned by Ringo). Returns a single display string:
 * - Arrays  → joined with newline (each PIN on its own line)
 * - Electricity / utility tokens → grouped into 4-digit chunks
 * - Everything else → returned as-is
 */
export function formatTokenDisplay(token: string | string[], serviceGroup: string | null | undefined): string {
  if (!token || (Array.isArray(token) && token.length === 0)) return "";

  if (Array.isArray(token)) {
    return token.join("\n");
  }

  const cleaned = token.replace(/\s+/g, "");

  // Group into 4-digit chunks for electricity & utility tokens (long numeric strings)
  if (
    (serviceGroup === "electricity" || serviceGroup === "water" || serviceGroup === "gas") &&
    /^\d{8,}$/.test(cleaned)
  ) {
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  }

  return token;
}

/**
 * Tailwind class maps for each colour key.
 * Returns bg, text, and border classes for the delivery result card.
 */
export function getDeliveryColorClasses(color: DeliveryDisplayInfo["color"]) {
  const map: Record<DeliveryDisplayInfo["color"], {
    bg: string;
    bgDark: string;
    border: string;
    borderDark: string;
    text: string;
    textDark: string;
    textMuted: string;
    iconBg: string;
    iconBgDark: string;
  }> = {
    amber: {
      bg: "bg-amber-50",
      bgDark: "dark:bg-amber-950/30",
      border: "border-amber-200",
      borderDark: "dark:border-amber-800",
      text: "text-amber-700",
      textDark: "dark:text-amber-300",
      textMuted: "text-amber-500",
      iconBg: "bg-amber-100",
      iconBgDark: "dark:bg-amber-900/40",
    },
    emerald: {
      bg: "bg-emerald-50",
      bgDark: "dark:bg-emerald-950/30",
      border: "border-emerald-200",
      borderDark: "dark:border-emerald-800",
      text: "text-emerald-700",
      textDark: "dark:text-emerald-300",
      textMuted: "text-emerald-500",
      iconBg: "bg-emerald-100",
      iconBgDark: "dark:bg-emerald-900/40",
    },
    blue: {
      bg: "bg-blue-50",
      bgDark: "dark:bg-blue-950/30",
      border: "border-blue-200",
      borderDark: "dark:border-blue-800",
      text: "text-blue-700",
      textDark: "dark:text-blue-300",
      textMuted: "text-blue-500",
      iconBg: "bg-blue-100",
      iconBgDark: "dark:bg-blue-900/40",
    },
    violet: {
      bg: "bg-violet-50",
      bgDark: "dark:bg-violet-950/30",
      border: "border-violet-200",
      borderDark: "dark:border-violet-800",
      text: "text-violet-700",
      textDark: "dark:text-violet-300",
      textMuted: "text-violet-500",
      iconBg: "bg-violet-100",
      iconBgDark: "dark:bg-violet-900/40",
    },
    sky: {
      bg: "bg-sky-50",
      bgDark: "dark:bg-sky-950/30",
      border: "border-sky-200",
      borderDark: "dark:border-sky-800",
      text: "text-sky-700",
      textDark: "dark:text-sky-300",
      textMuted: "text-sky-500",
      iconBg: "bg-sky-100",
      iconBgDark: "dark:bg-sky-900/40",
    },
    cyan: {
      bg: "bg-cyan-50",
      bgDark: "dark:bg-cyan-950/30",
      border: "border-cyan-200",
      borderDark: "dark:border-cyan-800",
      text: "text-cyan-700",
      textDark: "dark:text-cyan-300",
      textMuted: "text-cyan-500",
      iconBg: "bg-cyan-100",
      iconBgDark: "dark:bg-cyan-900/40",
    },
    teal: {
      bg: "bg-teal-50",
      bgDark: "dark:bg-teal-950/30",
      border: "border-teal-200",
      borderDark: "dark:border-teal-800",
      text: "text-teal-700",
      textDark: "dark:text-teal-300",
      textMuted: "text-teal-500",
      iconBg: "bg-teal-100",
      iconBgDark: "dark:bg-teal-900/40",
    },
  };

  return map[color];
}
