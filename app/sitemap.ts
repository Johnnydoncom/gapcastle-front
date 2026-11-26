import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { absoluteUrl } from "@/lib/site";

/** Public, indexable pages only. /account and /api are kept out (see robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/features"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/loans"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/signup"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/login"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const posts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.isoDate,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
