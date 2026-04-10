import Navbar from "@web/components/Navbar";
import Hero from "@web/components/Hero";
import Gallery from "@web/components/Gallery";
import ArtistsSection from "@web/components/ArtistsSection";
import InstagramFeed from "@web/components/InstagramFeed";
import StudioInfo from "@web/components/StudioInfo";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";

const Index = () => {
  const { locale } = useI18n();

  const title = locale === "es"
    ? "Tatuajes Santa Cruz de Tenerife | Lowkey Tattoo Estudio"
    : "Tattoo Studio Santa Cruz de Tenerife | Lowkey Tattoo";

  const description = locale === "es"
    ? "Estudio de tatuajes y piercing en Santa Cruz de Tenerife. Fine line, blackwork y piercing profesional. Diseños personalizados en Calle Dr. Allart, 50. Reserva tu cita online."
    : "Tattoo and piercing studio in Santa Cruz de Tenerife. Fine line, blackwork and professional piercing. Custom designs at Calle Dr. Allart, 50. Book your appointment online.";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={description} canonical="/" />
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
