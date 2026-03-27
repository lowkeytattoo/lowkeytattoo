import { motion } from "framer-motion";
import heroImage from "@/assets/hero-sacred.jpg";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { trackCtaClick } from "@web/lib/analytics";
import { CONTACT } from "@web/config/contact";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Hero = () => {
  const { t } = useI18n();
  const { openModal } = useBooking();

  return (
    <section className="relative min-h-[70vh] flex items-center pt-16 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Sacred geometry pattern"
          className="w-full h-full object-cover opacity-30"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-xl"
        >
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-4">
            {t("hero.coords")}
          </p>
          <h1 className="font-gothic text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.1] mb-5">
            {t("hero.h1.1")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mb-2 leading-relaxed">
            {t("hero.sub.1")}
          </p>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mb-6 leading-relaxed">
            {t("hero.sub.2")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { trackCtaClick("hero"); openModal(); }}
              className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase"
            >
              {t("nav.book")}
            </button>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 font-mono text-sm text-foreground tracking-wide hover:border-foreground transition-colors duration-200"
            >
              <WhatsAppIcon size={14} />
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
