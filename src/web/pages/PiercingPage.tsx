import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { CONTACT } from "@web/config/contact";
import { ROUTES } from "@web/config/routes";
import piercingPablo1 from "@/assets/lowkey_tattoo_tenerife_piercing_pablo.webp";
import tamuraImg from "@/assets/lowkey_tattoo_tenerife_tamura_banner_final.webp";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function PiercingPage() {
  const { t, locale } = useI18n();
  const { openModal } = useBooking();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];

  const SITE = "https://tattoolowkey.com";
  const TAMURA_START = "2026-05-22";
  const TAMURA_END   = "2026-05-29";
  const isEventVisible = new Date() < new Date(TAMURA_END);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${SITE}${r.piercing}#service`,
      name: t("piercing.h1"),
      provider: { "@id": `${SITE}/#business` },
      areaServed: "Santa Cruz de Tenerife",
      url: `${SITE}${r.piercing}`,
      description: t("piercing.meta.desc"),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("service.breadcrumb.home"), item: `${SITE}${r.home}` },
        { "@type": "ListItem", position: 2, name: t("piercing.h1"), item: `${SITE}${r.piercing}` },
      ],
    },
    ...(isEventVisible ? [{
      "@context": "https://schema.org",
      "@type": "Event",
      name: locale === "es"
        ? "Tamurathepiercer — Piercing profesional en Lowkey Tattoo Tenerife"
        : "Tamurathepiercer — Professional Piercing at Lowkey Tattoo Tenerife",
      startDate: TAMURA_START,
      endDate: TAMURA_END,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      description: locale === "es"
        ? "Tamurathepiercer, anilladora profesional, visita Lowkey Tattoo en Santa Cruz de Tenerife del 22 al 28 de mayo de 2026. Plazas muy limitadas."
        : "Professional body piercer Tamurathepiercer visits Lowkey Tattoo in Santa Cruz de Tenerife from 22 to 28 May 2026. Very limited spots.",
      image: `${SITE}${tamuraImg}`,
      url: `${SITE}${r.piercing}`,
      location: {
        "@type": "Place",
        name: "Lowkey Tattoo",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Calle Dr. Allart, 50",
          addressLocality: "Santa Cruz de Tenerife",
          addressRegion: "Tenerife",
          addressCountry: "ES",
        },
      },
      organizer: { "@type": "Organization", name: "Lowkey Tattoo", url: SITE },
      performer: {
        "@type": "Person",
        name: "Tamurathepiercer",
        url: "https://www.instagram.com/tamurathepiercer/",
      },
      offers: {
        "@type": "Offer",
        name: locale === "es"
          ? "Sesión de piercing — precio según joya y localización"
          : "Piercing session — price varies by jewellery and location",
        url: `${SITE}${r.piercing}`,
        availability: "https://schema.org/InStock",
        validFrom: TAMURA_START,
      },
    }] : []),
  ];

  const piercingTypes = [
    "lobe", "helix", "tragus", "daith", "nose", "industrial",
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("piercing.meta.title")}
        description={t("piercing.meta.desc")}
        canonical={r.piercing}
        alternateCanonical={alt.piercing}
        ogImage={`${SITE}${piercingPablo1}`}
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to={r.home} className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("piercing.h1")}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-6 leading-tight text-balance text-center">
            {t("piercing.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {t("piercing.intro")}
          </p>

          <div className="mb-16 rounded-lg overflow-hidden aspect-[16/7]">
            <img
              src={piercingPablo1}
              alt={`${t("piercing.h1")} — Lowkey Tattoo`}
              className="h-full w-full object-cover"
              loading="eager"
              width="1600"
              height="700"
            />
          </div>

          {/* Artista invitada – Tamurathepiercer */}
          {isEventVisible && (
            <section className="mb-16 border border-border rounded-lg overflow-hidden">
              <div className="aspect-[21/9] overflow-hidden">
                <img
                  src={tamuraImg}
                  alt="Tamurathepiercer — anilladora profesional invitada en Lowkey Tattoo Santa Cruz de Tenerife"
                  className="h-full w-full object-cover"
                  loading="eager"
                  width="1400"
                  height="600"
                />
              </div>
              <div className="p-8">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
                  {t("tamura.label")}
                </p>
                <h2 className="text-2xl font-medium text-foreground mb-4">
                  {t("tamura.h2")}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t("tamura.desc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`${CONTACT.whatsapp}?text=${encodeURIComponent(t("tamura.wa"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3"
                  >
                    <WhatsAppIcon size={14} />
                    {t("tamura.cta")}
                  </a>
                  <a
                    href="https://www.instagram.com/tamurathepiercer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center border border-border rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                  >
                    {t("tamura.ig")}
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Tipos */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("piercing.types.title")}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {piercingTypes.map((key) => (
                <div key={key} className="border border-border rounded-lg p-5">
                  <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    {t(`piercing.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`piercing.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Materiales */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("piercing.materials.title")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-3">{t("piercing.jewellery.title")}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(["1","2","3","4"] as const).map((n) => (
                    <li key={n}>{t(`piercing.jewellery.${n}`)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-3">{t("piercing.hygiene.title")}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(["1","2","3","4"] as const).map((n) => (
                    <li key={n}>{t(`piercing.hygiene.${n}`)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Cuidados */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-4">{t("piercing.aftercare.title")}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">{t("piercing.aftercare.p1")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("piercing.aftercare.p2")}</p>
          </section>

          {/* CTA */}
          <section className="border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-medium text-foreground mb-3">{t("piercing.cta.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("piercing.cta.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={openModal} className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3">
                {t("service.book.online")}
              </button>
              <a
                href={`${CONTACT.whatsapp}?text=${encodeURIComponent(t("gallery.piercing.wa"))}`}
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
              <Link to={r.tattoos} className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.tattoo")} →</Link>
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
