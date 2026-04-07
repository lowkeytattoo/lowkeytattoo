import { Link, useParams, Navigate } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBlogPost, usePublishedBlogPosts } from "@admin/hooks/useBlogPosts";
import { format } from "date-fns";
import { es, enGB } from "date-fns/locale";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const dateFnsLocale = locale === "es" ? es : enGB;

  const { data: post, isLoading, isError } = useBlogPost(slug ?? "");
  const { data: allPosts } = usePublishedBlogPosts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="max-w-3xl mx-auto px-6 space-y-4 animate-pulse">
            <div className="h-3 w-48 bg-muted rounded" />
            <div className="h-8 w-3/4 bg-muted rounded" />
            <div className="space-y-2 mt-8">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-3 bg-muted rounded" />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !post) return <Navigate to="/blog" replace />;

  const otherPosts = (allPosts ?? []).filter((p) => p.slug !== post.slug).slice(0, 3);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description,
      datePublished: post.date,
      dateModified: post.updated_at.split("T")[0],
      image: "https://tattoolowkey.com/Banner_lowkeytattoo.jpg",
      author: { "@type": "Organization", name: "Lowkey Tattoo", url: "https://tattoolowkey.com" },
      publisher: {
        "@type": "Organization",
        name: "Lowkey Tattoo",
        url: "https://tattoolowkey.com",
        logo: { "@type": "ImageObject", url: "https://tattoolowkey.com/Banner_lowkeytattoo.jpg" },
      },
      mainEntityOfPage: `https://tattoolowkey.com/blog/${post.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tattoolowkey.com/" },
        { "@type": "ListItem", position: 2, name: t("blog.h1"), item: "https://tattoolowkey.com/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `https://tattoolowkey.com/blog/${post.slug}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} | Lowkey Tattoo`}
        description={post.meta_description ?? post.excerpt ?? ""}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">{t("blog.h1")}</Link>
            <span className="mx-2">/</span>
            <span className="truncate max-w-[200px] inline-block align-bottom">{post.title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-6">
            <time dateTime={post.date} className="font-mono text-xs text-muted-foreground">
              {format(new Date(post.date), locale === "es" ? "d 'de' MMMM yyyy" : "MMMM d, yyyy", { locale: dateFnsLocale })}
            </time>
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-10 leading-tight">
            {post.title}
          </h1>

          <div
            className="prose prose-invert prose-sm md:prose-base max-w-none
              prose-headings:font-medium prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed [&_p]:text-justify [&_p]:mb-5
              prose-li:text-muted-foreground
              prose-a:text-foreground prose-a:underline prose-a:underline-offset-4
              prose-strong:text-foreground
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
              prose-img:rounded-lg prose-img:my-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-12 border border-border rounded-lg p-6 text-center">
            <p className="font-medium text-foreground mb-2">{t("blog.cta.title")}</p>
            <p className="text-sm text-muted-foreground mb-4">{t("blog.cta.desc")}</p>
            <a
              href="https://wa.me/34674116189"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 inline-block"
            >
              {t("blog.cta.btn")}
            </a>
          </div>

          {otherPosts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6">{t("blog.more")}</p>
              <div className="space-y-4">
                {otherPosts.map((p) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="block group">
                    <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{p.title}</p>
                    <p className="font-mono text-xs text-muted-foreground/60 mt-0.5">
                      {format(new Date(p.date), "d MMM yyyy", { locale: dateFnsLocale })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link to="/blog" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              {t("blog.back")}
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
