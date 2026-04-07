import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useI18n } from "@web/i18n/I18nProvider";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";

const NotFound = () => {
  const { locale } = useI18n();
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{isEs ? "Página no encontrada | Lowkey Tattoo" : "Page Not Found | Lowkey Tattoo"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">404</p>
          <h1 className="text-3xl font-medium text-foreground mb-3">
            {isEs ? "Página no encontrada" : "Page not found"}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {isEs
              ? "La página que buscas no existe o ha sido movida."
              : "The page you're looking for doesn't exist or has been moved."}
          </p>
          <Link
            to="/"
            className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase px-6 py-3 inline-block"
          >
            {isEs ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
