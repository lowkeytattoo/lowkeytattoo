import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";
import { usePublishedBlogPosts } from "@admin/hooks/useBlogPosts";
import { format } from "date-fns";
import { es, enGB } from "date-fns/locale";

const PAGE_SIZE = 9;

export default function BlogPage() {
  const { t, locale } = useI18n();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];
  const dateFnsLocale = locale === "es" ? es : enGB;
  const { data: posts, isLoading } = usePublishedBlogPosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("blog.meta.title")}
        description={t("blog.meta.desc")}
        canonical={r.blog}
        alternateCanonical={alt.blog}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to={r.home} className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("blog.h1")}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">{t("blog.h1")}</h1>
          <p className="text-muted-foreground mb-12 leading-relaxed">{t("blog.intro")}</p>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-border pb-8 animate-pulse">
                  <div className="h-3 w-24 bg-muted rounded mb-3" />
                  <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {(posts ?? []).slice(0, visibleCount).map((post) => (
                  <article key={post.slug} className="border-b border-border pb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <time dateTime={post.date} className="font-mono text-xs text-muted-foreground">
                        {format(new Date(post.date), "d MMM yyyy", { locale: dateFnsLocale })}
                      </time>
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h2 className="text-xl font-medium text-foreground mb-2">
                      <Link to={r.blogPost(post.slug)} className="hover:text-muted-foreground transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{post.excerpt}</p>
                    )}
                    <Link to={r.blogPost(post.slug)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                      {t("blog.read")}
                    </Link>
                  </article>
                ))}
              </div>
              {(posts ?? []).length > visibleCount && (
                <div className="mt-10 text-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest border border-border rounded-sm px-6 py-3 hover:border-muted-foreground"
                  >
                    {t("blog.more")}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
