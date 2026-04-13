/** Single source of truth for all public URL paths in both locales. */

export const ROUTES = {
  es: {
    home:     "/",
    tattoos:  "/tatuajes-santa-cruz-tenerife",
    piercing: "/piercing-tenerife",
    laser:    "/laser-eliminacion-tatuajes-tenerife",
    blog:     "/blog",
    blogPost: (slug: string) => `/blog/${slug}`,
    privacy:  "/politica-de-privacidad",
    legal:    "/aviso-legal",
  },
  en: {
    home:     "/en",
    tattoos:  "/en/tattoos-tenerife",
    piercing: "/en/piercing-tenerife",
    laser:    "/en/laser-tattoo-removal-tenerife",
    blog:     "/en/blog",
    blogPost: (slug: string) => `/en/blog/${slug}`,
    privacy:  "/politica-de-privacidad",  // legal pages are ES-only
    legal:    "/aviso-legal",
  },
} as const;

/** Derive locale purely from the URL pathname. */
export function localeFromPath(pathname: string): "en" | "es" {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

/** Given a pathname and a target locale, return the equivalent URL in that locale. */
export function switchLocaleUrl(pathname: string, to: "en" | "es"): string {
  const from = localeFromPath(pathname);
  if (from === to) return pathname;

  // Static page pairs
  const pairs: [string, string][] = [
    [ROUTES.es.home,     ROUTES.en.home],
    [ROUTES.es.tattoos,  ROUTES.en.tattoos],
    [ROUTES.es.piercing, ROUTES.en.piercing],
    [ROUTES.es.laser,    ROUTES.en.laser],
    [ROUTES.es.blog,     ROUTES.en.blog],
    [ROUTES.es.privacy,  ROUTES.es.privacy],  // same URL both locales
    [ROUTES.es.legal,    ROUTES.es.legal],
  ];

  if (to === "en") {
    const hit = pairs.find(([es]) => pathname === es);
    if (hit) return hit[1];
    if (pathname.startsWith("/blog/")) return `/en${pathname}`;
    return ROUTES.en.home;
  } else {
    const hit = pairs.find(([, en]) => pathname === en);
    if (hit) return hit[0];
    if (pathname.startsWith("/en/blog/")) return pathname.slice(3); // remove /en prefix
    return ROUTES.es.home;
  }
}
