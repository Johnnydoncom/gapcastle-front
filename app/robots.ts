import type { MetadataRoute } from "next";

/**
 * Keeps crawlers off the signed-in area and API routes. Each crawl there
 * would run a function and be redirected to /login anyway.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/api/"],
    },
  };
}
