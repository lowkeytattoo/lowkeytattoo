import { Instagram } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { CONTACT } from "@web/config/contact";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer id="contact" className="border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="font-gothic text-foreground text-2xl tracking-normal leading-none">
              Lowkey Tattoo
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {t("hero.coords")}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              MON—FRI 11:00–19:00
            </span>
            <a
              href={`tel:${CONTACT.phone}`}
              className="font-mono text-xs text-muted-foreground tabular-nums hover:text-foreground transition-colors"
            >
              {CONTACT.phonePretty}
            </a>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={16} />
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.copy")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
