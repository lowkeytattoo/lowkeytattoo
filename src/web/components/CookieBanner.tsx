import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCookieConsent } from "@web/contexts/CookieConsentContext";
import { useI18n } from "@web/i18n/I18nProvider";
import { ROUTES } from "@web/config/routes";
import type { ConsentCategory, ConsentChoices } from "@web/lib/analytics";

// Accept / reject / configure share the same visual weight (AEPD cookie guide 2023).
const btn =
  "font-mono text-xs tracking-[0.1em] uppercase border border-foreground/60 text-foreground px-4 py-2 rounded-sm hover:bg-foreground hover:text-background transition-colors duration-200";

const CATEGORIES: ConsentCategory[] = ["analytics", "marketing", "external"];

const Toggle = ({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? "bg-primary" : "bg-muted"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

export const CookieBanner = () => {
  const { pending, consent, settingsOpen, acceptAll, rejectAll, save, openSettings, closeSettings } =
    useCookieConsent();
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState<ConsentChoices>(consent);

  // Start the settings panel from the current choices each time it opens.
  useEffect(() => {
    if (settingsOpen) setDraft(consent);
  }, [settingsOpen, consent]);

  const visible = pending || settingsOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          role="dialog"
          aria-live="polite"
          aria-label={t("cookies.title")}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-5 max-h-[85vh] overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto">
            {!settingsOpen ? (
              /* ── Layer 1 ─────────────────────────────────────────────── */
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-1.5">
                    {t("cookies.title")}
                  </p>
                  <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed">
                    {t("cookies.desc")}{" "}
                    <Link to={ROUTES[locale].cookies} className="underline underline-offset-4 hover:text-foreground">
                      {t("cookies.policy")}
                    </Link>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button onClick={rejectAll} className={btn}>{t("cookies.reject")}</button>
                  <button onClick={openSettings} className={btn}>{t("cookies.configure")}</button>
                  <button onClick={acceptAll} className={btn}>{t("cookies.accept")}</button>
                </div>
              </div>
            ) : (
              /* ── Layer 2: per-purpose settings ───────────────────────── */
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-1.5">
                      {t("cookies.settings")}
                    </p>
                    <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed">
                      {t("cookies.settings.desc")}{" "}
                      <Link to={ROUTES[locale].cookies} className="underline underline-offset-4 hover:text-foreground">
                        {t("cookies.policy")}
                      </Link>
                    </p>
                  </div>
                  {!pending && (
                    <button
                      onClick={closeSettings}
                      aria-label={t("cookies.close")}
                      className="font-mono text-lg leading-none text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>

                <ul className="divide-y divide-border border border-border rounded-sm">
                  <li className="flex items-start justify-between gap-4 p-3">
                    <div>
                      <p className="text-sm text-foreground">{t("cookies.cat.necessary")}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t("cookies.cat.necessary.desc")}</p>
                    </div>
                    <Toggle checked disabled label={t("cookies.cat.necessary")} />
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat} className="flex items-start justify-between gap-4 p-3">
                      <div>
                        <p className="text-sm text-foreground">{t(`cookies.cat.${cat}`)}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t(`cookies.cat.${cat}.desc`)}</p>
                      </div>
                      <Toggle
                        checked={draft[cat]}
                        label={t(`cookies.cat.${cat}`)}
                        onChange={() => setDraft((d) => ({ ...d, [cat]: !d[cat] }))}
                      />
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={rejectAll} className={btn}>{t("cookies.reject")}</button>
                  <button onClick={() => save(draft)} className={btn}>{t("cookies.save")}</button>
                  <button onClick={acceptAll} className={btn}>{t("cookies.accept")}</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
