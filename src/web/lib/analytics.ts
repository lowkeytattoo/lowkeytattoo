/**
 * analytics.ts — Central module for GA4, Google Ads and Meta Pixel.
 *
 * All functions are no-ops when the platform ID is missing or when
 * consent has not been granted yet (GDPR / LSSI compliance).
 *
 * Usage:
 *   1. Call restoreConsent() once on app mount.
 *   2. Call grantConsent() / denyConsent() from the cookie banner.
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

function hasConsent(): boolean {
  try {
    return localStorage.getItem("lowkey-consent") === "granted";
  } catch {
    return false;
  }
}
// GA4 requires Arguments objects in dataLayer, not plain arrays.
// We delegate to the global window.gtag defined in index.html, which uses
// `arguments` internally → dataLayer.push(arguments) → correct format.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gtag(...args: any[]): void {
  if (typeof window === "undefined") return;
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
function initGA4(): void {
  if (!GA4_ID || typeof window === "undefined") return;
  if (isInternalTraffic()) {
    markInternalTraffic();
    return;
  }

  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(s);
  }

  gtag("js", new Date());
  gtag("config", GA4_ID, { send_page_view: true, anonymize_ip: true });
}

function initGoogleAds(): void {
  if (!ADS_ID) return;
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

/** Grant consent: upgrades Consent Mode v2 and initialises all platforms. */
export function grantConsent(): void {
  gtag("consent", "update", {
    analytics_storage:  "granted",
    ad_storage:         "granted",
    ad_user_data:       "granted",
    ad_personalization: "granted",
  });
  initGA4();
  initGoogleAds();
  initMetaPixel();
  try { localStorage.setItem("lowkey-consent", "granted"); } catch { /* noop */ }
}

/** Deny consent: keeps storage denied and revokes Meta Pixel. */
export function denyConsent(): void {
  gtag("consent", "update", {
    analytics_storage:  "denied",
    ad_storage:         "denied",
    ad_user_data:       "denied",
    ad_personalization: "denied",
  });
  fbq("consent", "revoke");
  try { localStorage.setItem("lowkey-consent", "denied"); } catch { /* noop */ }
}

/**
 * Restore consent from localStorage on app mount.
 * Returns the stored value ("granted" | "denied" | null).
 */
export function restoreConsent(): "granted" | "denied" | null {
  try {
    const stored = localStorage.getItem("lowkey-consent") as "granted" | "denied" | null;
    if (stored === "granted") grantConsent();
    return stored;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Events
// ─────────────────────────────────────────────────────────────────────────────

/** Hero or Navbar CTA button clicked. */
export function trackCtaClick(location: "hero" | "navbar" | "mobile_menu"): void {
  if (!GA4_ID) return;
  gtag("event", "cta_click", { event_category: "engagement", event_label: location, send_to: GA4_ID });
  if (ADS_ID) gtag("event", "conversion", { send_to: `${ADS_ID}/cta_click`, event_category: "lead" });
  if (hasConsent()) fbq("track", "Contact");
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
