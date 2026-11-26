import type { Metadata } from "next";
import { PageHero, SectionHeader } from "@/components/SectionHeader";
import { JsonLd } from "@/components/JsonLd";
import { BlogExplorer } from "@/components/marketing/BlogExplorer";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { BLOG_TAGS, getBlogPostSummaries } from "@/lib/blog-posts";
import { SITE, absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";

const BLOG_TITLE = "Blog — Money Tips & Bill Payment Guides for Nigerians";
const BLOG_DESCRIPTION = "Practical guides on paying bills online, saving on airtime and data, avoiding payment scams, starting a VTU business and managing money in Nigeria.";

export const metadata: Metadata = pageMetadata({ title: BLOG_TITLE, description: BLOG_DESCRIPTION, path: "/blog" });

export default function BlogPage() {
  const posts = getBlogPostSummaries();

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ type: "CollectionPage", name: BLOG_TITLE, description: BLOG_DESCRIPTION, path: "/blog" }),
          breadcrumbSchema([{ name: "Blog", path: "/blog" }]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${SITE.name} Blog`,
            url: absoluteUrl("/blog"),
            publisher: { "@id": ORGANIZATION_ID },
            blogPost: posts.map((post) => ({
              "@type": "BlogPosting",
              headline: post.title,
              url: absoluteUrl(`/blog/${post.slug}`),
              datePublished: post.isoDate,
              author: { "@type": "Person", name: post.author },
            })),
          },
        ]}
      />
      <PageHero
        eyebrow="GapCastle Blog"
        title={<>Stories, tips and ideas for <span className="gradient-text">smart money</span></>}
        subtitle="Practical guides on bills, loans, business and financial wellness — written by the people building GapCastle."
      />

      <section className="container py-12">
        <BlogExplorer posts={posts} tags={BLOG_TAGS} />
      </section>

      {/* Newsletter */}
      <section className="container py-12">
        <div className="rounded-3xl border bg-card p-10 text-center shadow-card md:p-14">
          <SectionHeader eyebrow="Newsletter" title="Money tips, in your inbox" subtitle="Join 8,000+ Nigerians getting one practical money tip every Tuesday morning." />
          <NewsletterForm email={SITE.email} />
        </div>
      </section>
    </>
  );
}
