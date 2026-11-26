/**
 * Single source of truth for Gap Castle's public business details.
 *
 * Copied from the live site (https://gapcastle.com, home + /contact). Every
 * marketing page, the footer, JSON-LD and llms.txt read from here, so a change
 * of number, email or address is made once. Keep it in step with gapcastle.com.
 */
const ADDRESS_FULL = "29b Olorunnimbe Street, Wemabod Estate, Off Adeniyi Jones, Ikeja, Lagos";

export const SITE = {
  name: "Gap Castle",
  alternateName: "GapCastle",
  legalName: "Gap Castle Limited",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://gapcastle.com").replace(/\/$/, ""),
  tagline: "Your bridge to financial gap",
  title: "Gap Castle — Pay Bills, Buy Airtime & Data, Get Quick Loans in Nigeria",
  description:
    "Pay airtime, data, cable TV, electricity, internet, education and insurance bills in Nigeria in seconds, earn cashback on every payment, and access quick loans with Gap Castle, a registered money lender in Ikeja, Lagos.",
  foundingYear: "2020",
  email: "support@gapcastle.com",
  phone: {
    display: "+234 201 887 6442",
    e164: "+2342018876442",
  },
  whatsappUrl: "https://wa.link/9e094r",
  address: {
    street: "29b Olorunnimbe Street, Wemabod Estate, Off Adeniyi Jones",
    locality: "Ikeja",
    region: "Lagos",
    country: "NG",
    countryName: "Nigeria",
    full: ADDRESS_FULL,
  },
  hours: {
    weekdays: "Monday – Friday, 9:00am – 4:00pm",
    weekend: "Saturday & Sunday — Closed",
    short: "Mon–Fri, 9AM–4PM WAT",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "16:00",
  },
  social: {
    facebook: "https://web.facebook.com/gapcastle",
  },
  mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_FULL)}&output=embed`,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_FULL)}`,
  services: [
    "Airtime",
    "Data bundles",
    "Cable TV subscriptions",
    "Electricity bills",
    "Internet subscriptions",
    "Education PINs (WAEC, JAMB, NECO)",
    "Insurance premiums",
    "Water and gas bills",
    "Collections and levies",
    "Quick loans",
  ],
} as const;

/** Absolute URL for a site path, e.g. absoluteUrl("/blog") → https://gapcastle.com/blog. */
export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
