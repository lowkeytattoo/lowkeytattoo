import { lazy, Suspense } from "react";
import Navbar from "@web/components/Navbar";
import Hero from "@web/components/Hero";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";

// Below-fold components — split into a separate chunk so they don't block
// the initial JS parse/execution that drives TBT and LCP.
const Gallery       = lazy(() => import("@web/components/Gallery"));
const ArtistsSection = lazy(() => import("@web/components/ArtistsSection"));
const InstagramFeed  = lazy(() => import("@web/components/InstagramFeed"));
const StudioInfo     = lazy(() => import("@web/components/StudioInfo"));
const Footer         = lazy(() => import("@web/components/Footer"));

const SITE = "https://tattoolowkey.com";

const Index = () => {
  const { locale } = useI18n();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];

  const title = locale === "es"
    ? "Tatuajes Santa Cruz de Tenerife | Lowkey Tattoo Estudio"
    : "Tattoo Studio Santa Cruz de Tenerife | Lowkey Tattoo";

  const description = locale === "es"
    ? "Estudio de tatuajes y piercing en Santa Cruz de Tenerife. Fine line, blackwork y diseños personalizados. Calle Dr. Allart, 50 — reserva tu cita online."
    : "Tattoo and piercing studio in Santa Cruz de Tenerife. Fine line, blackwork and custom designs. Calle Dr. Allart, 50 — book your appointment online.";

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE}/#webpage`,
      url: `${SITE}/`,
      name: title,
      description,
      inLanguage: locale,
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#business` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${SITE}/#tattoo-service`,
      name: locale === "es" ? "Tatuajes en Santa Cruz de Tenerife" : "Tattoos in Santa Cruz de Tenerife",
      provider: { "@id": `${SITE}/#business` },
      areaServed: { "@type": "City", name: "Santa Cruz de Tenerife" },
      url: `${SITE}${r.tattoos}`,
      description: locale === "es"
        ? "Tatuajes fine line, geométrico y blackwork. Diseños 100% personalizados."
        : "Fine line, geometric and blackwork tattoos. 100% custom designs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={description} canonical={r.home} alternateCanonical={alt.home} schema={schemas} />
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <Gallery />
        <ArtistsSection />
        <InstagramFeed />
        <StudioInfo />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
