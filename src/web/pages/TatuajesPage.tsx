import { Link } from "react-router-dom";
import { CONTACT } from "@web/config/contact";
import { ROUTES } from "@web/config/routes";
import ogTatuajesImg from "@/assets/lowkey_tattoo_tenerife_pablo_matos_1.webp";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { ARTISTS, PUBLIC_ARTISTS } from "@shared/config/artists";
import { ArtistWorkRow } from "@web/components/Gallery";

export default function TatuajesPage() {
  const { t, locale } = useI18n();
  const { openModal } = useBooking();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];

  const SITE = "https://tattoolowkey.com";
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${SITE}${r.tattoos}#service`,
      name: t("tattoos.h1"),
      provider: { "@id": `${SITE}/#business` },
      areaServed: "Santa Cruz de Tenerife",
      url: `${SITE}${r.tattoos}`,
      description: t("tattoos.meta.desc"),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("service.breadcrumb.home"), item: `${SITE}${r.home}` },
        { "@type": "ListItem", position: 2, name: t("tattoos.h1"), item: `${SITE}${r.tattoos}` },
      ],
    },
  ];

  const styles = [
    { key: "fineline" },
    { key: "blackwork" },
    { key: "custom" },
    { key: "anime" },
  ] as const;

  const whyItems = [
    t("tattoos.why.1"),
    t("tattoos.why.2"),
    t("tattoos.why.3"),
    t("tattoos.why.4"),
    t("tattoos.why.5"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("tattoos.meta.title")}
        description={t("tattoos.meta.desc")}
        canonical={r.tattoos}
        alternateCanonical={alt.tattoos}
        ogImage={`${SITE}${ogTatuajesImg}`}
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Breadcrumb */}
          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to={r.home} className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("tattoos.h1")}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-6 leading-tight text-balance text-center">
            {t("tattoos.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t("tattoos.intro")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <button onClick={openModal} className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3">
              {t("service.book.online")}
            </button>
            <a
              href={`${CONTACT.whatsapp}?text=${encodeURIComponent(t("gallery.tattoo.wa"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-border rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              <WhatsAppIcon size={14} />
              {t("service.whatsapp")}
            </a>
          </div>

          {/* Artists */}
          <div className="flex flex-col gap-4 mb-16">
            {PUBLIC_ARTISTS(ARTISTS).map((artist, i) => (
              <ArtistWorkRow key={artist.id} artist={artist} index={i} />
            ))}
          </div>

          {/* Estilos */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("tattoos.styles.title")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {styles.map(({ key }) => (
                <div key={key} className="border border-border rounded-lg p-6">
                  <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-3">
                    {t(`tattoos.${key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(`tattoos.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Por qué */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("tattoos.why.title")}</h2>
            <ul className="space-y-3 text-muted-foreground">
              {whyItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-foreground font-mono text-xs mt-1 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-medium text-foreground mb-3">{t("tattoos.cta.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("tattoos.cta.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={openModal} className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3">
                {t("service.book.online")}
              </button>
              <a
                href={`${CONTACT.whatsapp}?text=${encodeURIComponent(t("gallery.tattoo.wa"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-border rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              >
                <WhatsAppIcon size={14} />
                {t("service.whatsapp")}
              </a>
            </div>
          </section>

          {/* Internal links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">{t("service.also")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to={r.piercing} className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.piercing")} →</Link>
              <Link to={r.laser} className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.laser")} →</Link>
              <Link to={r.blog} className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">Blog →</Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
