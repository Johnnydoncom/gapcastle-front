import { SITE, absoluteUrl } from "@/lib/site";

/**
 * schema.org builders for the public site. Every value comes from lib/site.ts
 * so the JSON-LD always matches the contact details shown on the page.
 */
export const ORGANIZATION_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

type JsonLdObject = Record<string, unknown>;

export function organizationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "FinancialService"],
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    alternateName: SITE.alternateName,
    legalName: SITE.legalName,
    slogan: SITE.tagline,
    description: SITE.description,
    url: SITE.url,
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl("/opengraph-image"),
    email: SITE.email,
    telephone: SITE.phone.e164,
    foundingDate: SITE.foundingYear,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    hasMap: SITE.mapUrl,
    areaServed: { "@type": "Country", name: SITE.address.countryName },
    currenciesAccepted: "NGN",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SITE.hours.days,
        opens: SITE.hours.opens,
        closes: SITE.hours.closes,
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: SITE.phone.e164,
        email: SITE.email,
        url: absoluteUrl("/contact"),
        areaServed: SITE.address.country,
        availableLanguage: ["English"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: SITE.hours.days,
          opens: SITE.hours.opens,
          closes: SITE.hours.closes,
        },
      },
    ],
    sameAs: [SITE.social.facebook, SITE.whatsappUrl],
    knowsAbout: SITE.services,
  };
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    alternateName: SITE.alternateName,
    url: SITE.url,
    inLanguage: "en-NG",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function faqSchema(faqs: ReadonlyArray<{ q: string; a: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** Breadcrumb trail; Home is prepended automatically. */
export function breadcrumbSchema(items: ReadonlyArray<{ name: string; path: string }>): JsonLdObject {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageSchema({
  type = "WebPage",
  name,
  description,
  path,
}: {
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en-NG",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
  };
}
