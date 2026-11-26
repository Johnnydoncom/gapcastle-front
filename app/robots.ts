import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Keeps crawlers off the signed-in area and API routes. Each crawl there
 * would run a function and be redirected to /login anyway.
 *
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) are allowed
 * on purpose: being quoted by answer engines is part of the GEO strategy.
 * Don't block them in the Vercel firewall either.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
