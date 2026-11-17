import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  restoreConsent,
  saveConsent,
  initContactTracking,
  NO_CONSENT,
  ALL_CONSENT,
  type ConsentCategory,
  type ConsentChoices,
} from "@web/lib/analytics";

interface CookieConsentContextValue {
  /** Banner must be shown (never decided, or consent expired). */
  pending: boolean;
  /** Effective choices (all false until the user decides). */
  consent: ConsentChoices;
  settingsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choices: ConsentChoices) => void;
  /** Grant a single category, keeping the rest as they are (e.g. "Load map"). */
  acceptCategory: (category: ConsentCategory) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState(true);
  const [consent, setConsent] = useState<ConsentChoices>(NO_CONSENT);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    initContactTracking();
    const stored = restoreConsent();
    if (stored) {
      setConsent(stored);
      setPending(false);
    }
  }, []);

  const save = useCallback((choices: ConsentChoices) => {
    const reloading = saveConsent(choices);
    if (reloading) return;
    setConsent(choices);
    setPending(false);
    setSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(() => save(ALL_CONSENT), [save]);
  const rejectAll = useCallback(() => save(NO_CONSENT), [save]);
  const acceptCategory = useCallback(
    (category: ConsentCategory) => save({ ...consent, [category]: true }),
    [consent, save],
  );
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{ pending, consent, settingsOpen, acceptAll, rejectAll, save, acceptCategory, openSettings, closeSettings }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
};
