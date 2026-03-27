import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { grantConsent, denyConsent, restoreConsent } from "@web/lib/analytics";

type ConsentState = "pending" | "granted" | "denied";

interface CookieConsentContextValue {
  consentState: ConsentState;
  accept: () => void;
  decline: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consentState, setConsentState] = useState<ConsentState>("pending");

  useEffect(() => {
    const stored = restoreConsent();
    if (stored === "granted") setConsentState("granted");
    else if (stored === "denied") setConsentState("denied");
    // else remains "pending" → banner shows
  }, []);

  const accept = useCallback(() => {
    grantConsent();
    setConsentState("granted");
  }, []);

  const decline = useCallback(() => {
    denyConsent();
    setConsentState("denied");
  }, []);

  return (
    <CookieConsentContext.Provider value={{ consentState, accept, decline }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
};
