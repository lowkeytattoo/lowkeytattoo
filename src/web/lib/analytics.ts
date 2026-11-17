/**
 * analytics.ts — Central module for GA4, Google Ads and Meta Pixel.
 *
 * All functions are no-ops when the platform ID is missing or when
 * consent for the matching category has not been granted (RGPD / LSSI art. 22.2):
 *   analytics → GA4 · marketing → Google Ads + Meta Pixel · external → Google Maps
 *
 * Usage:
 *   1. Call restoreConsent() once on app mount.
 *   2. Call saveConsent() from the cookie banner / settings panel.
 *   3. Call individual track* functions from components.
 */

// ── Environment IDs ───────────────────────────────────────────────────────────
const GA4_ID   = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const ADS_ID   = import.meta.env.VITE_GOOGLE_ADS_ID      as string | undefined;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID      as string | undefined;

// ── Type declarations ─────────────────────────────────────────────────────────
declare global {
  interface Window {
    dataLayer: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// ── Consent storage ───────────────────────────────────────────────────────────
// Stored per category with a timestamp. Consent expires after 12 months
// (AEPD cookie guide: renew at most every 24 months) and the banner reappears.

export type ConsentCategory = "analytics" | "marketing" | "external";
export type ConsentChoices = Record<ConsentCategory, boolean>;

const CONSENT_KEY = "lowkey-consent";
const CONSENT_VERSION = 2;
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export const NO_CONSENT: ConsentChoices = { analytics: false, marketing: false, external: false };
export const ALL_CONSENT: ConsentChoices = { analytics: true, marketing: true, external: true };

/** Current stored choices, or null if never decided / expired. */
export function readConsent(): ConsentChoices | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentChoices> & { v?: number; ts?: number };
    if (parsed.v !== CONSENT_VERSION || typeof parsed.ts !== "number") return null; // old format → ask again
    if (Date.now() - parsed.ts > CONSENT_MAX_AGE_MS) return null;
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      external:  parsed.external === true,
    };
  } catch {
    return null;
  }
}

function hasConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

// GA4 requires Arguments objects in dataLayer, not plain arrays.
// We delegate to the global window.gtag defined in index.html, which uses
// `arguments` internally → dataLayer.push(arguments) → correct format.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gtag(...args: any[]): void {
  if (typeof window === "undefined") return;
  if (args[0] === "event") {
    const sendTo = String(args[2]?.send_to ?? "");
    const needed: ConsentCategory = sendTo.startsWith("AW-") ? "marketing" : "analytics";
    if (!hasConsent(needed)) return;
  }
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fbq(...args: any[]): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq(...args);
}

// ── Internal traffic (owner / staff) ──────────────────────────────────────────
// Anyone who has opened the admin panel on a device is flagged, and GA4 is
// disabled there on every page so their own visits don't pollute the data.
const INTERNAL_KEY = "lowkey-internal";

function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/admin")) return true;
  try {
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

/** Flag this device as internal traffic (called from the admin panel). */
export function markInternalTraffic(): void {
  try { localStorage.setItem(INTERNAL_KEY, "1"); } catch { /* noop */ }
  // Official GA4 opt-out flag; stops hits even if gtag.js is already loaded.
  if (GA4_ID) (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = true;
}

// ── Platform bootstraps (called after consent) ────────────────────────────────
function loadGtagLibrary(id: string): void {
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  gtag("js", new Date());
}

let ga4Started = false;
function initGA4(): void {
  if (!GA4_ID || typeof window === "undefined" || ga4Started) return;
  if (isInternalTraffic()) {
    markInternalTraffic();
    return;
  }
  ga4Started = true;
  loadGtagLibrary(GA4_ID);
  gtag("config", GA4_ID, { send_page_view: true, anonymize_ip: true });
}

let adsStarted = false;
function initGoogleAds(): void {
  if (!ADS_ID || typeof window === "undefined" || adsStarted) return;
  adsStarted = true;
  loadGtagLibrary(ADS_ID);
  gtag("config", ADS_ID);
}

function initMetaPixel(): void {
  if (!PIXEL_ID || typeof window === "undefined") return;
  if (typeof window.fbq === "function") return;

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true; t.src = v;
    b.head.appendChild(t);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Consent
// ─────────────────────────────────────────────────────────────────────────────

/** Cookies set by the tracking platforms on our own domain. */
const TRACKING_COOKIE = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc)/;

function deleteTrackingCookies(): void {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (!TRACKING_COOKIE.test(name)) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    });
  });
}

/** Push choices to Consent Mode v2 and start only the allowed platforms. */
function applyConsent(c: ConsentChoices): void {
  gtag("consent", "update", {
    analytics_storage:  c.analytics ? "granted" : "denied",
    ad_storage:         c.marketing ? "granted" : "denied",
    ad_user_data:       c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
  if (c.analytics) initGA4();
  if (c.marketing) {
    initGoogleAds();
    initMetaPixel();
  }
}

/**
 * Save the user's choices. If something previously granted is now withdrawn,
 * tracking cookies are deleted and the page reloads so already-loaded scripts
 * stop running. Returns true when a reload was triggered.
 */
export function saveConsent(c: ConsentChoices): boolean {
  const previous = readConsent();
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, ts: Date.now(), ...c }));
  } catch { /* noop */ }

  const withdrawn =
    !!previous &&
    ((previous.analytics && !c.analytics) ||
     (previous.marketing && !c.marketing) ||
     (previous.external && !c.external));

  if (withdrawn) {
    gtag("consent", "update", {
      analytics_storage:  c.analytics ? "granted" : "denied",
      ad_storage:         c.marketing ? "granted" : "denied",
      ad_user_data:       c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
    });
    if (!c.marketing) fbq("consent", "revoke");
    if (!c.analytics && GA4_ID) (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = true;
    deleteTrackingCookies();
    window.location.reload();
    return true;
  }

  applyConsent(c);
  return false;
}

/**
 * Restore consent from localStorage on app mount.
 * Returns the stored choices, or null if the banner must be shown.
 */
export function restoreConsent(): ConsentChoices | null {
  const stored = readConsent();
  if (stored) applyConsent(stored);
  return stored;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Events
// ─────────────────────────────────────────────────────────────────────────────

/** Hero or Navbar CTA button clicked. */
export function trackCtaClick(location: "hero" | "navbar" | "mobile_menu"): void {
  if (!GA4_ID) return;
  gtag("event", "cta_click", { event_category: "engagement", event_label: location, send_to: GA4_ID });
  if (ADS_ID) gtag("event", "conversion", { send_to: `${ADS_ID}/cta_click`, event_category: "lead" });
  fbq("track", "Contact");
}

/**
 * Booking modal opened — fired by every "Solicitar cita" button on the site.
 * `cita_click` is the key event imported into Google Ads.
 */
export function trackBookingOpen(): void {
  if (!GA4_ID || isInternalTraffic()) return;
  const page = window.location.pathname;
  gtag("event", "booking_open", { event_category: "booking", send_to: GA4_ID });
  gtag("event", "cita_click", { page, send_to: GA4_ID });
}

/** User completes a step inside the booking modal. */
export function trackBookingStep(step: 1 | 2 | 3): void {
  if (!GA4_ID) return;
  gtag("event", "booking_step_complete", { event_category: "booking", step_number: step, send_to: GA4_ID });
}

/** Booking form successfully submitted — primary conversion. */
export function trackBookingSubmit(artistName: string): void {
  if (!GA4_ID) return;
  gtag("event", "booking_submit", { event_category: "booking", artist_name: artistName, send_to: GA4_ID });
  if (ADS_ID) gtag("event", "conversion", { send_to: `${ADS_ID}/booking_submit`, event_category: "lead" });
  fbq("track", "Lead");
}

/** Gallery category card clicked (Tattoo / Piercing / Laser). */
export function trackCategorySelect(category: "tattoo" | "piercing" | "laser"): void {
  if (!GA4_ID) return;
  gtag("event", "category_select", { event_category: "gallery", category_name: category, send_to: GA4_ID });
  fbq("track", "ViewContent", { content_name: category, content_category: "gallery" });
}

/** Artist card rendered / viewed in the Tattoo sub-grid. */
export function trackArtistView(artistId: string, artistName: string): void {
  if (!GA4_ID) return;
  gtag("event", "artist_view", { event_category: "gallery", artist_id: artistId, artist_name: artistName, send_to: GA4_ID });
}

/** Instagram link clicked anywhere on the site. */
export function trackIgClick(handle: string, location: "gallery" | "feed" | "footer"): void {
  if (!GA4_ID) return;
  gtag("event", "ig_click", { event_category: "social", ig_handle: handle, click_location: location, send_to: GA4_ID });
}

/** Contact form in the studio section submitted. */
export function trackContactSubmit(): void {
  if (!GA4_ID) return;
  gtag("event", "contact_submit", { event_category: "lead", send_to: GA4_ID });
  fbq("track", "Lead");
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact link tracking — WhatsApp and phone
// ─────────────────────────────────────────────────────────────────────────────

let contactTrackingStarted = false;

/**
 * One delegated listener that catches every WhatsApp (wa.me) and tel: link on
 * the site, including links inside blog posts. Events only reach GA4 once the
 * user has accepted cookies (gtag.js isn't loaded before that).
 */
export function initContactTracking(): void {
  if (contactTrackingStarted || typeof document === "undefined") return;
  contactTrackingStarted = true;

  document.addEventListener("click", (e) => {
    if (!GA4_ID || isInternalTraffic()) return;
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    const page = window.location.pathname;

    if (href.includes("wa.me")) {
      gtag("event", "whatsapp_click", { page, link_text: a.innerText.trim().slice(0, 100), send_to: GA4_ID });
      fbq("track", "Contact");
    } else if (href.startsWith("tel:")) {
      gtag("event", "phone_click", { page, send_to: GA4_ID });
      fbq("track", "Contact");
    }
  }, { capture: true });
}
