/**
 * Vercel Edge Middleware — first-visit language redirect
 * Uses native Web APIs (Vite SPA, no Next.js).
 *
 * Logic:
 *  1. Skip if the request is already on an /en/* path.
 *  2. Skip if the `lowkey-lang` cookie is set (user already has a preference).
 *  3. Skip admin routes and static assets.
 *  4. If Accept-Language primary tag is English → redirect to equivalent /en/* URL.
 */

// Map Spanish paths → English equivalents
const ES_TO_EN: Record<string, string> = {
  "/": "/en",
  "/tatuajes-santa-cruz-tenerife": "/en/tattoos-tenerife",
  "/piercing-tenerife": "/en/piercing-tenerife",
  "/laser-eliminacion-tatuajes-tenerife": "/en/laser-tattoo-removal-tenerife",
  "/blog": "/en/blog",
};

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);
  const { pathname } = url;

  // Already on an English route — nothing to do
  if (pathname === "/en" || pathname.startsWith("/en/")) return;

  // Skip admin, assets, and internals
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_") ||
    pathname.includes(".")
  ) return;

  // Skip bots, crawlers and synthetic monitoring tools
  const ua = request.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|pingdom|googlebot|bingbot|yandex/i.test(ua)) return;
  // Also skip if no user-agent at all (synthetic requests)
  if (!ua) return;

  // Respect existing language preference cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const langCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("lowkey-lang="))
    ?.split("=")[1];
  if (langCookie) return;

  // Parse Accept-Language — take the first language tag
  const acceptLang = request.headers.get("accept-language") ?? "";
  const primary = acceptLang.split(",")[0]?.trim().toLowerCase() ?? "";

  if (primary.startsWith("en")) {
    let enPath: string | undefined = ES_TO_EN[pathname];
    // Blog posts: /blog/:slug → /en/blog/:slug
    if (!enPath && pathname.startsWith("/blog/")) {
      enPath = `/en${pathname}`;
    }
    if (!enPath) return;

    url.pathname = enPath;
    return Response.redirect(url.toString(), 302);
  }
}

export const config = {
  matcher: [
    "/((?!en/|admin|_vercel|.*\\..*).*)",
  ],
};
