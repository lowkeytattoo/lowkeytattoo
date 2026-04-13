import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { trackCtaClick } from "@web/lib/analytics";
import { cn } from "@shared/lib/utils";
import { ROUTES, switchLocaleUrl } from "@web/config/routes";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { locale, t } = useI18n();
  const { openModal } = useBooking();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Navigate to the equivalent page in the other language
  const toggleLang = () => {
    const target = locale === "en" ? "es" : "en";
    navigate(switchLocaleUrl(pathname, target));
  };

  const r = ROUTES[locale];

  const serviceLinks = [
    { to: r.tattoos,  label: t("nav.services.tattoo") },
    { to: r.piercing, label: t("nav.services.piercing") },
    { to: r.laser,    label: t("nav.services.laser") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={r.home} className="font-gothic text-foreground text-2xl md:text-3xl tracking-normal leading-none">
          Lowkey Tattoo
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href={`${r.home}#gallery`} className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            {t("nav.gallery")}
          </a>

          {/* Services dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors duration-250"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
            >
              {t("nav.services")}
              <ChevronDown
                size={13}
                className={cn("transition-transform duration-200", servicesOpen && "rotate-180")}
              />
            </button>

            <div
              className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52 transition-all duration-150",
                servicesOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
              )}
            >
              <div className="bg-card border border-border rounded-md shadow-lg py-1">
                {serviceLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setServicesOpen(false)}
                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <a href={`${r.home}#studio`} className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            {t("nav.studio")}
          </a>
          <Link to={r.blog} className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-250">
            Blog
          </Link>

          {/* Language switcher — navigates to equivalent URL in other locale */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono hover:text-foreground transition-colors duration-250"
            aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
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

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono hover:text-foreground"
            aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
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

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 nav-blur px-6 py-6 flex flex-col gap-1">
          <a href={`${r.home}#gallery`} onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground py-2">{t("nav.gallery")}</a>

          <div>
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="flex items-center justify-between w-full text-muted-foreground text-sm hover:text-foreground py-2"
            >
              {t("nav.services")}
              <ChevronDown size={13} className={cn("transition-transform duration-200", servicesOpen && "rotate-180")} />
            </button>
            {servicesOpen && (
              <div className="pl-4 flex flex-col gap-1 mb-1">
                {serviceLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => { setOpen(false); setServicesOpen(false); }}
                    className="text-muted-foreground text-sm hover:text-foreground py-1.5 border-l border-border pl-3 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a href={`${r.home}#studio`} onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground py-2">{t("nav.studio")}</a>
          <Link to={r.blog} onClick={() => setOpen(false)} className="text-muted-foreground text-sm hover:text-foreground py-2">Blog</Link>
          <button
            onClick={() => { setOpen(false); trackCtaClick("mobile_menu"); openModal(); }}
            className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase text-center mt-3 py-3"
          >
            {t("nav.book")}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
