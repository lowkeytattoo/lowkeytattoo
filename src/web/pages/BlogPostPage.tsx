import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { CONTACT } from "@web/config/contact";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";
import { useBlogPost, usePublishedBlogPosts } from "@admin/hooks/useBlogPosts";
import { format } from "date-fns";
import { es, enGB } from "date-fns/locale";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];
  const dateFnsLocale = locale === "es" ? es : enGB;

  const { data: post, isLoading, isError } = useBlogPost(slug ?? "");
  const { data: allPosts } = usePublishedBlogPosts();

  const [showContact, setShowContact] = useState(false);
  const [cfName, setCfName] = useState("");
  const [cfContact, setCfContact] = useState("");
  const [cfMessage, setCfMessage] = useState("");
  const [cfSending, setCfSending] = useState(false);
  const [cfSent, setCfSent] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfSending(true);
    try {
      const { supabase } = await import("@shared/lib/supabase");
      const isEmail = cfContact.includes("@");
      await supabase.from("web_bookings").insert({
        client_name: cfName,
        client_email: isEmail ? cfContact : null,
        client_phone: isEmail ? null : cfContact,
        description: cfMessage,
        artist_config_id: null,
        preferred_date: null,
        preferred_time: null,
        body_zone: null,
        is_first_time: null,
        status: "pending",
      });
      const { default: emailjs } = await import("@emailjs/browser");
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, { from_name: cfName, from_contact: cfContact, message: cfMessage }, publicKey);
      }
      setCfSent(true);
      setCfName(""); setCfContact(""); setCfMessage("");
    } finally {
      setCfSending(false);
    }
  };

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

  if (isError || !post) return <Navigate to={r.blog} replace />;

  const otherPosts = (allPosts ?? []).filter((p) => p.slug !== post.slug).slice(0, 3);
  const waMsg = post.slug.includes("tamura") ? t("tamura.wa") : t("blog.wa.msg");

  const firstImage =
    post.cover_image ??
    post.content.match(/<img[^>]+src="([^"]+)"/)?.[1] ??
    "https://tattoolowkey.com/lowkey_tattoo_tenerife_banner.png";

  const SITE = "https://tattoolowkey.com";
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description,
      datePublished: post.date,
      dateModified: post.updated_at.split("T")[0],
      image: firstImage,
      author: { "@type": "Organization", name: "Lowkey Tattoo", url: SITE },
      publisher: {
        "@type": "Organization",
        name: "Lowkey Tattoo",
        url: SITE,
        logo: { "@type": "ImageObject", url: `${SITE}/lowkey_tattoo_tenerife_banner.png` },
      },
      mainEntityOfPage: `${SITE}${r.blogPost(post.slug)}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("service.breadcrumb.home"), item: `${SITE}${r.home}` },
        { "@type": "ListItem", position: 2, name: t("blog.h1"), item: `${SITE}${r.blog}` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}${r.blogPost(post.slug)}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} | Lowkey Tattoo`}
        description={post.meta_description ?? post.excerpt ?? ""}
        canonical={r.blogPost(post.slug)}
        alternateCanonical={alt.blogPost(post.slug)}
        ogType="article"
        ogImage={firstImage}
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to={r.home} className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <Link to={r.blog} className="hover:text-foreground transition-colors">{t("blog.h1")}</Link>
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

          <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-8 leading-tight">
            {post.title}
          </h1>

          {post.cover_image && (
            <div className="mb-10 rounded-lg overflow-hidden aspect-[16/7]">
              <img
                src={post.cover_image}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}

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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`${CONTACT.whatsapp}?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 inline-flex items-center justify-center gap-2"
              >
                <WhatsAppIcon size={14} />
                {t("blog.cta.btn")}
              </a>
              <button
                onClick={() => setShowContact((v) => !v)}
                className="inline-flex items-center justify-center gap-2 border border-border rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              >
                <MessageSquare size={14} />
                {t("blog.cta.contact")}
              </button>
            </div>

            {showContact && (
              <div className="mt-6 pt-6 border-t border-border text-left">
                {cfSent ? (
                  <p className="font-mono text-sm text-foreground text-center">{t("contact.form.success")}</p>
                ) : (
                  <form onSubmit={handleContactSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                        {t("contact.form.name")} *
                      </label>
                      <input
                        required
                        value={cfName}
                        onChange={(e) => setCfName(e.target.value)}
                        placeholder={t("contact.form.placeholder.name")}
                        className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                        {t("contact.form.contact")} *
                      </label>
                      <input
                        required
                        value={cfContact}
                        onChange={(e) => setCfContact(e.target.value)}
                        placeholder={t("contact.form.placeholder.contact")}
                        className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                        {t("contact.form.message")} *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={cfMessage}
                        onChange={(e) => setCfMessage(e.target.value)}
                        placeholder={t("contact.form.placeholder.message")}
                        className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={cfSending}
                        className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 disabled:opacity-60"
                      >
                        {cfSending ? t("contact.form.sending") : t("contact.form.submit")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {otherPosts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6">{t("blog.more")}</p>
              <div className="space-y-4">
                {otherPosts.map((p) => (
                  <Link key={p.slug} to={r.blogPost(p.slug)} className="block group">
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
            <Link to={r.blog} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              {t("blog.back")}
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
