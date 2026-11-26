import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/**
 * Next merges metadata shallowly: a page that sets `openGraph` replaces the
 * layout's whole object. Pages build theirs from this base so siteName and
 * locale are never lost.
 */
export const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name} — pay bills, buy airtime and data, and get quick loans in Nigeria`,
};

/**
 * A page-level `openGraph` drops the image app/opengraph-image.tsx would
 * otherwise add, so the image is listed explicitly here.
 */
export const BASE_OPEN_GRAPH: {
  siteName: string;
  locale: string;
  type: "website";
  images: (typeof DEFAULT_SHARE_IMAGE)[];
} = {
  siteName: SITE.name,
  locale: "en_NG",
  type: "website",
  images: [DEFAULT_SHARE_IMAGE],
};

/** Title, description, canonical and social cards for a marketing page. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...BASE_OPEN_GRAPH, title, description, url: path },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_SHARE_IMAGE.url] },
  };
}
