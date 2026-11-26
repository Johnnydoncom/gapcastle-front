import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog-posts";
import { SITE, absoluteUrl } from "@/lib/site";
import { BASE_OPEN_GRAPH, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
import { ORGANIZATION_ID, breadcrumbSchema } from "@/lib/structured-data";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

/** Every post is pre-rendered at build time; unknown slugs 404. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  const path = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    alternates: { canonical: path },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: path,
      publishedTime: post.isoDate,
      authors: [post.author],
      section: post.tag,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [DEFAULT_SHARE_IMAGE.url] },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const path = `/blog/${post.slug}`;
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const wordCount = [post.excerpt, ...post.body].join(" ").split(/\s+/).length;

  return (
    <article className="container py-20">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.isoDate,
            dateModified: post.isoDate,
            author: { "@type": "Person", name: post.author },
            publisher: {
              "@type": "Organization",
              "@id": ORGANIZATION_ID,
              name: SITE.name,
              logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
            url: absoluteUrl(path),
            image: absoluteUrl("/opengraph-image"),
            articleSection: post.tag,
            inLanguage: "en-NG",
            wordCount,
          },
          breadcrumbSchema([
            { name: "Blog", path: "/blog" },
            { name: post.title, path },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="line-clamp-1 text-foreground">{post.title}</li>
        </ol>
      </nav>

      <header className={`mt-6 rounded-3xl bg-gradient-to-br ${post.color} p-12 md:p-16 animate-fade-in-up`}>
        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold backdrop-blur"><Tag aria-hidden className="h-3 w-3" />{post.tag}</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><User aria-hidden className="h-4 w-4" />{post.author}</span>
          <span className="flex items-center gap-1"><Calendar aria-hidden className="h-4 w-4" /><time dateTime={post.isoDate}>{post.date}</time></span>
          <span className="flex items-center gap-1"><Clock aria-hidden className="h-4 w-4" />{post.read}</span>
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground animate-fade-in">
        <p className="text-lg text-foreground">{post.excerpt}</p>
        {post.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </div>

      <aside className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Want to put this into practice?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Open a free GapCastle account and start saving on every bill today.</p>
        <Link href="/signup"><Button className="mt-4 gap-2">Get started free <ArrowRight className="h-4 w-4" /></Button></Link>
      </aside>

      <section className="mx-auto mt-16 max-w-5xl" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-2xl font-bold">More from the blog</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group rounded-2xl border bg-card p-6 shadow-card hover-lift">
              <p className="text-xs font-semibold text-primary">{p.tag}</p>
              <h3 className="mt-2 font-bold leading-tight transition-colors group-hover:text-primary">{p.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </Link>
          ))}
        </div>
        <Link href="/blog" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">← Back to all articles</Link>
      </section>
    </article>
  );
}
