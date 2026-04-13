import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { translations, type Locale } from "./translations";
import { localeFromPath } from "@web/config/routes";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Provides i18n context. Locale is derived entirely from the URL path:
 *   /en  or  /en/*  → "en"
 *   anything else   → "es"
 *
 * This means Google always indexes the correct language per URL:
 *   Googlebot crawls /  → Spanish
 *   Googlebot crawls /en → English
 * No navigator.language, no localStorage fallback needed for locale detection.
 */
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Initial state from current URL (works on first paint before any navigation)
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== "undefined"
      ? localeFromPath(window.location.pathname)
      : "es"
  );

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string) => translations[locale]?.[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Must be rendered inside <BrowserRouter> and inside <I18nProvider>.
 * Keeps the locale in sync with the current URL on every navigation.
 * Also writes the current locale to localStorage so the Vercel Edge
 * Middleware can read it as a cookie and skip the first-visit redirect.
 */
export function LocaleSync() {
  const { pathname } = useLocation();
  const { setLocale } = useI18n();

  useEffect(() => {
    const newLocale = localeFromPath(pathname);
    setLocale(newLocale);
    // Write as a document cookie (not just localStorage) so the Edge
    // Middleware can read it on subsequent server requests
    document.cookie = `lowkey-lang=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
  }, [pathname]);

  return null;
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
