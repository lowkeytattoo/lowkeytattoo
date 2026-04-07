import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import laserImg from "@/assets/laser_lowkey.webp";

export default function LaserPage() {
  const { t } = useI18n();
  const { openModal } = useBooking();

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://tattoolowkey.com/laser-eliminacion-tatuajes-tenerife#service",
      name: t("laser.h1"),
      provider: { "@id": "https://tattoolowkey.com/#business" },
      areaServed: "Santa Cruz de Tenerife",
      url: "https://tattoolowkey.com/laser-eliminacion-tatuajes-tenerife",
      description: t("laser.meta.desc"),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tattoolowkey.com/" },
        { "@type": "ListItem", position: 2, name: t("laser.h1"), item: "https://tattoolowkey.com/laser-eliminacion-tatuajes-tenerife" },
      ],
    },
  ];

  const steps = [
    { n: "01", key: "step1" },
    { n: "02", key: "step2" },
    { n: "03", key: "step3" },
    { n: "04", key: "step4" },
  ] as const;

  const faqs = ["faq1", "faq2", "faq3", "faq4"] as const;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("laser.meta.title")}
        description={t("laser.meta.desc")}
        canonical="/laser-eliminacion-tatuajes-tenerife"
        schema={schemas}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          <nav className="mb-8 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">{t("service.breadcrumb.home")}</Link>
            <span className="mx-2">/</span>
            <span>{t("laser.h1")}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-6 leading-tight">
            {t("laser.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            {t("laser.intro")}
          </p>

          <div className="mb-16 rounded-lg overflow-hidden aspect-[16/7]">
            <img
              src={laserImg}
              alt={`${t("laser.h1")} — Lowkey Tattoo`}
              className="h-full w-full object-cover"
              loading="eager"
              width="1600"
              height="700"
            />
          </div>

          {/* Cómo funciona */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("laser.how.title")}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">{t("laser.how.p1")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("laser.how.p2")}</p>
          </section>

          {/* Proceso */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("laser.steps.title")}</h2>
            <div className="space-y-4">
              {steps.map(({ n, key }) => (
                <div key={key} className="flex gap-6 p-5 border border-border rounded-lg">
                  <span className="font-mono text-2xl text-muted-foreground/40 shrink-0 w-8">{n}</span>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{t(`laser.${key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`laser.${key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="text-2xl font-medium text-foreground mb-6">{t("laser.faq.title")}</h2>
            <div className="space-y-5">
              {faqs.map((key) => (
                <div key={key} className="border-b border-border pb-5">
                  <h3 className="font-medium text-foreground mb-2">{t(`laser.${key}.q`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`laser.${key}.a`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-medium text-foreground mb-3">{t("laser.cta.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("laser.cta.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={openModal} className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3">
                {t("laser.cta.btn")}
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
              <Link to="/piercing-tenerife" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">{t("gallery.cat.piercing")} →</Link>
              <Link to="/blog" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm px-4 py-2">Blog →</Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
