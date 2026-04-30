import Navbar from "@web/components/Navbar";
import Hero from "@web/components/Hero";
import Gallery from "@web/components/Gallery";
import ArtistsSection from "@web/components/ArtistsSection";
import InstagramFeed from "@web/components/InstagramFeed";
import StudioInfo from "@web/components/StudioInfo";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";

const SITE = "https://tattoolowkey.com";

const Index = () => {
  const { locale } = useI18n();
  const r = ROUTES[locale];
  const alt = ROUTES[locale === "es" ? "en" : "es"];

  const title = locale === "es"
    ? "Tatuajes Santa Cruz de Tenerife | Lowkey Tattoo Estudio"
    : "Tattoo Studio Santa Cruz de Tenerife | Lowkey Tattoo";

  const description = locale === "es"
    ? "Estudio de tatuajes y piercing en Santa Cruz de Tenerife. Fine line, blackwork y piercing profesional. Diseños personalizados en Calle Dr. Allart, 50. Reserva tu cita online."
    : "Tattoo and piercing studio in Santa Cruz de Tenerife. Fine line, blackwork and professional piercing. Custom designs at Calle Dr. Allart, 50. Book your appointment online.";

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
      <Gallery />
      <ArtistsSection />
      <InstagramFeed />
      <StudioInfo />
      <Footer />
    </div>
  );
};

export default Index;
