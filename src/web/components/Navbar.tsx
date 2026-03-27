import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { trackCtaClick } from "@web/lib/analytics";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const { openModal } = useBooking();

  const toggleLang = () => setLocale(locale === "en" ? "es" : "en");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-gothic text-foreground text-2xl md:text-3xl tracking-normal leading-none">
          Lowkey Tattoo
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#gallery" className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            {t("nav.gallery")}
          </a>
          <a href="#studio" className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            {t("nav.studio")}
          </a>
          <a href="#contact" className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            {t("nav.location")}
          </a>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono hover:text-foreground transition-colors duration-250"
            aria-label="Switch language"
          >
            <Globe size={14} />
            {locale.toUpperCase()}
          </button>
          <button
            onClick={() => { trackCtaClick("navbar"); openModal(); }}
            className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase"
          >
            {t("nav.book")}
          </button>
        </div>

        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono hover:text-foreground"
            aria-label="Switch language"
          >
            <Globe size={14} />
            {locale.toUpperCase()}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="text-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 nav-blur px-6 py-6 flex flex-col gap-4">
          <a href="#gallery" onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground">{t("nav.gallery")}</a>
          <a href="#studio" onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground">{t("nav.studio")}</a>
          <a href="#contact" onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground">{t("nav.location")}</a>
          <button
            onClick={() => { setOpen(false); trackCtaClick("mobile_menu"); openModal(); }}
            className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase text-center mt-2"
          >
            {t("nav.book")}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
