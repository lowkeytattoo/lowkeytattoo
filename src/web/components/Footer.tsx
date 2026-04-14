import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";
import { CONTACT } from "@web/config/contact";

const Footer = () => {
  const { t, locale } = useI18n();
  const r = ROUTES[locale];

  return (
    <footer id="contact" className="border-t border-border pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link to={r.home} className="font-gothic text-foreground text-2xl tracking-normal leading-none">
              Lowkey Tattoo
            </Link>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {t("hero.coords")}
            </span>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              aria-label="Instagram @tattoo.lowkey"
            >
              <Instagram size={16} />
            </a>
          </div>

          {/* Servicios */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t("footer.services")}</p>
            <Link to={r.tattoos} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.services.tattoo")}</Link>
            <Link to={r.piercing} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.services.piercing")}</Link>
            <Link to={r.laser} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.services.laser")}</Link>
            <Link to={r.blog} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </div>

          {/* Contacto */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t("footer.contact")}</p>
            <span className="font-mono text-xs text-muted-foreground">{t("footer.hours")}</span>
            <a href={`tel:${CONTACT.phone}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors tabular-nums">
              {CONTACT.phonePretty}
            </a>
            <a href={`${CONTACT.whatsapp}?text=${encodeURIComponent(t("hero.wa.msg"))}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              WhatsApp
            </a>
            <address className="font-mono text-xs text-muted-foreground not-italic">
              Calle Dr. Allart, 50<br />Santa Cruz de Tenerife, 38003
            </address>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.copy")} · {t("footer.madeby")}{" "}
            <a href="https://arpweb.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              ARP Web
            </a>
          </p>
          <div className="flex items-center gap-4">
            <Link to="/politica-de-privacidad" className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              {t("footer.privacy")}
            </Link>
            <Link to="/aviso-legal" className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              {t("footer.legal")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
