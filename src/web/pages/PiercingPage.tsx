import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import gallery4 from "@/assets/gallery-4.jpg";

export default function PiercingPage() {
  const { t } = useI18n();
  const { openModal } = useBooking();

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://tattoolowkey.com/piercing-tenerife#service",
      name: t("piercing.h1"),
      provider: { "@id": "https://tattoolowkey.com/#business" },
      areaServed: "Santa Cruz de Tenerife",
      url: "https://tattoolowkey.com/piercing-tenerife",
      description: t("piercing.meta.desc"),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tattoolowkey.com/" },
        { "@type": "ListItem", position: 2, name: t("piercing.h1"), item: "https://tattoolowkey.com/piercing-tenerife" },
      ],
    },
  ];

  const piercingTypes = [
    "lobe", "helix", "tragus", "daith", "nose", "industrial",
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("piercing.meta.title")}
        description={t("piercing.meta.desc")}
        canonical="/piercing-tenerife"
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("piercing.h1")}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-6 leading-tight">
            {t("piercing.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            {t("piercing.intro")}
          </p>

          <div className="mb-16 rounded-lg overflow-hidden aspect-[16/7]">
            <img
              src={gallery4}
              alt={`${t("piercing.h1")} — Lowkey Tattoo`}
              className="h-full w-full object-cover"
              loading="eager"
              width="1600"
              height="700"
            />
          </div>

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
              <Link to="/tatuajes-santa-cruz-tenerife" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.tattoo")} →</Link>
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
