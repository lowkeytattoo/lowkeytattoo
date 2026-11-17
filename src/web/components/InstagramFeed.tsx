import { useEffect, useRef } from "react";
import { useI18n } from "@web/i18n/I18nProvider";
import { useCookieConsent } from "@web/contexts/CookieConsentContext";
import { CONTACT } from "@web/config/contact";

const InstagramFeed = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useI18n();
  const { consent, acceptCategory, openSettings } = useCookieConsent();

  // Elfsight is third-party content: only load it with "external" consent.
  useEffect(() => {
    if (!consent.external) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          // Only inject the script if it hasn't been loaded yet
          if (!document.querySelector('script[src*="elfsightcdn.com/platform.js"]')) {
            const script = document.createElement("script");
            script.src = "https://elfsightcdn.com/platform.js";
            script.async = true;
            document.body.appendChild(script);
          } else if (window.eapps) {
            // Script already present — re-init any pending widgets
            window.eapps?.AppsManager?.initAll?.();
          }
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [consent.external]);

  return (
    <section ref={sectionRef} className="pt-8 pb-14 md:pt-10 md:pb-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        {!consent.external ? (
          <div className="bg-card rounded-lg p-8 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{t("instagram.blocked")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => acceptCategory("external")}
                className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase"
              >
                {t("instagram.load")}
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t("cookies.settings")}
              </button>
            </div>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {CONTACT.instagramHandle} ↗
            </a>
          </div>
        ) : (
        <div className="relative">
          <div
            className="elfsight-app-755d111e-72eb-4329-b649-a7b85c5a9c00"
            data-elfsight-app-lazy
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-background pointer-events-none" />
        </div>
        )}
      </div>
    </section>
  );
};

export default InstagramFeed;
