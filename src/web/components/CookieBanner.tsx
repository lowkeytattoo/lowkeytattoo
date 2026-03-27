import { AnimatePresence, motion } from "framer-motion";
import { useCookieConsent } from "@web/contexts/CookieConsentContext";
import { useI18n } from "@web/i18n/I18nProvider";

export const CookieBanner = () => {
  const { consentState, accept, decline } = useCookieConsent();
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {consentState === "pending" && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          role="dialog"
          aria-live="polite"
          aria-label={t("cookies.title")}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-sm px-6 py-5"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-1.5">
                {t("cookies.title")}
              </p>
              <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed">
                {t("cookies.desc")}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={decline}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 border border-border px-4 py-2 rounded-sm hover:border-muted-foreground"
              >
                {t("cookies.decline")}
              </button>
              <button
                onClick={accept}
                className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase"
              >
                {t("cookies.accept")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
