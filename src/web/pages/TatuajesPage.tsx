import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { ARTISTS } from "@shared/config/artists";
import gallery1 from "@/assets/gallery-1.webp";
import gallery2 from "@/assets/gallery-2.webp";
import gallery3 from "@/assets/gallery-3.webp";

export default function TatuajesPage() {
  const { t } = useI18n();
  const { openModal } = useBooking();

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://tattoolowkey.com/tatuajes-santa-cruz-tenerife#service",
      name: t("tattoos.h1"),
      provider: { "@id": "https://tattoolowkey.com/#business" },
      areaServed: "Santa Cruz de Tenerife",
      url: "https://tattoolowkey.com/tatuajes-santa-cruz-tenerife",
      description: t("tattoos.meta.desc"),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tattoolowkey.com/" },
        { "@type": "ListItem", position: 2, name: t("tattoos.h1"), item: "https://tattoolowkey.com/tatuajes-santa-cruz-tenerife" },
      ],
    },
  ];

  const styles = [
    { key: "fineline", img: gallery1 },
    { key: "blackwork", img: gallery2 },
    { key: "custom", img: null },
    { key: "anime", img: null },
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
        canonical="/tatuajes-santa-cruz-tenerife"
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Breadcrumb */}
          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("tattoos.h1")}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-6 leading-tight">
            {t("tattoos.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            {t("tattoos.intro")}
          </p>

          {/* Gallery preview */}
          <div className="grid grid-cols-3 gap-2 mb-16 rounded-lg overflow-hidden">
            {[gallery1, gallery2, gallery3].map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img
                  src={src}
                  alt={`${t("tattoos.h1")} — Lowkey Tattoo ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
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

          {/* Artistas */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("tattoos.artists.title")}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {ARTISTS.map((artist) => (
                <div key={artist.id} className="border border-border rounded-lg p-5">
                  <p className="font-medium text-foreground mb-1">{artist.name}</p>
                  <p className="font-mono text-xs text-muted-foreground mb-3">{artist.handle}</p>
                  <div className="flex flex-wrap gap-1">
                    {artist.styles.map((s) => (
                      <span key={s} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
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
                href="https://wa.me/34674116189"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              >
                {t("service.whatsapp")}
              </a>
            </div>
          </section>

          {/* Internal links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">{t("service.also")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/piercing-tenerife" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.piercing")} →</Link>
              <Link to="/laser-eliminacion-tatuajes-tenerife" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.laser")} →</Link>
              <Link to="/blog" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">Blog →</Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
