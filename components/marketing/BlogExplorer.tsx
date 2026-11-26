"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BlogPostSummary } from "@/lib/blog-posts";

/**
 * Search + tag filter for the blog index. The first render (tag "All", empty
 * query) lists every post, so the full list is in the server HTML.
 */
export function BlogExplorer({ posts, tags }: { posts: readonly BlogPostSummary[]; tags: readonly string[] }) {
  const [tag, setTag] = useState("All");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const filtered = posts.filter((post) =>
    (tag === "All" || post.tag === tag) &&
    (needle === "" || post.title.toLowerCase().includes(needle) || post.excerpt.toLowerCase().includes(needle)),
  );
  const [featured, ...rest] = filtered;

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search articles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${tag === t ? "gradient-primary border-transparent text-primary-foreground shadow-card" : "bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {featured && (
        <Link href={`/blog/${featured.slug}`} className="mt-10 block animate-fade-in-up">
          <article className="group grid gap-6 overflow-hidden rounded-3xl border bg-card shadow-card hover-lift md:grid-cols-2">
            <div className={`relative aspect-video bg-gradient-to-br ${featured.color} p-10 md:aspect-auto`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold backdrop-blur"><Tag aria-hidden className="h-3 w-3" />{featured.tag}</span>
              <div className="absolute bottom-6 left-10 right-10 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{featured.author}</span>·<time dateTime={featured.isoDate}>{featured.date}</time>·<span>{featured.read}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Featured</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">{featured.title}</h2>
              <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">Read article <ArrowRight aria-hidden className="h-4 w-4" /></span>
            </div>
          </article>
        </Link>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} style={{ animationDelay: `${i * 80}ms` }} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card hover-lift animate-fade-in-up">
            <article className="flex flex-1 flex-col">
              <div className={`relative aspect-video bg-gradient-to-br ${post.color} p-6`}>
                <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold backdrop-blur"><Tag aria-hidden className="h-3 w-3" />{post.tag}</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold leading-tight transition-colors group-hover:text-primary">{post.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <time dateTime={post.isoDate}>{post.date}</time><span>{post.read}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-10 text-center text-muted-foreground">No articles match your search.</p>}
    </>
  );
}
