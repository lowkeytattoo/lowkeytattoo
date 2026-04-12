import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectLocale(): Locale {
  const saved = localStorage.getItem("lowkey-lang") as Locale | null;
  if (saved && (saved === "en" || saved === "es")) return saved;
  // Always default to Spanish — this is a Spanish business in Tenerife.
  // Browser language detection is intentionally removed: it caused Googlebot
  // (navigator.language = "en-US") to render English titles, breaking ES rankings.
  // Users who prefer English can switch via the language toggle (saved to localStorage).
  return "es";
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lowkey-lang", l);
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

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
