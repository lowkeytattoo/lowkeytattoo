/**
 * Vercel Edge Middleware
 *
 * Two responsibilities:
 *  1. Social-bot interception — WhatsApp/Facebook/etc. don't execute JS, so they
 *     always read the static index.html OG tags. For blog posts this gives the
 *     wrong image/title. When a social crawler hits /blog/:slug (or /en/blog/:slug)
 *     we fetch the post from Supabase and return a minimal HTML shell with the
 *     correct OG meta tags so the preview is accurate.
 *
 *  2. First-visit language redirect — if a real user's Accept-Language is English
 *     and they haven't set a preference cookie, redirect to the /en/* equivalent.
 */

const SITE = "https://tattoolowkey.com";
const OG_BANNER = `${SITE}/og_banner.jpg`;

// Social sharing crawlers that don't execute JS
const SOCIAL_BOT_RE =
  /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|vkShare|pinterest/i;

// Matches /blog/:slug and /en/blog/:slug — captures the slug
const BLOG_POST_RE = /^(?:\/en)?\/blog\/([^/?#]+)$/;

// Map Spanish paths → English equivalents (for language redirect)
const ES_TO_EN: Record<string, string> = {
  "/": "/en",
  "/tatuajes-santa-cruz-tenerife": "/en/tattoos-tenerife",
  "/piercing-tenerife": "/en/piercing-tenerife",
  "/laser-eliminacion-tatuajes-tenerife": "/en/laser-tattoo-removal-tenerife",
  "/blog": "/en/blog",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  locale: string;
}): string {
  const { title, description, image, url, locale } = opts;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Lowkey Tattoo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${image}">
</head>
<body></body>
</html>`;
}

interface BlogPost {
  title: string;
  meta_description: string | null;
  excerpt: string | null;
  cover_image: string | null;
}

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=title,meta_description,excerpt,cover_image&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows: BlogPost[] = await res.json();
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function middleware(
  request: Request
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const { pathname } = url;
  const ua = request.headers.get("user-agent") ?? "";

  // Skip admin, assets, and Vercel internals (always, for everyone)
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_") ||
    pathname.includes(".")
  )
    return;

  // ── Social bot interception ───────────────────────────────────────────────
  if (SOCIAL_BOT_RE.test(ua)) {
    const match = pathname.match(BLOG_POST_RE);
    if (match) {
      const slug = match[1];
      const post = await fetchBlogPost(slug);
      if (post) {
        const locale = pathname.startsWith("/en/") ? "en" : "es";
        const canonicalUrl = `${SITE}${pathname}`;
        const image = post.cover_image ?? OG_BANNER;
        const description =
          post.meta_description ?? post.excerpt ?? "";
        return new Response(
          buildOgHtml({
            title: `${post.title} | Lowkey Tattoo`,
            description,
            image,
            url: canonicalUrl,
            locale,
          }),
          { headers: { "content-type": "text/html;charset=utf-8" } }
        );
      }
    }
    // Non-blog pages: pass through — index.html already has static OG tags
    return;
  }

  // ── Language redirect (real users only) ──────────────────────────────────

  // Already on an English route — nothing to do
  if (pathname === "/en" || pathname.startsWith("/en/")) return;

  // Skip SEO bots, synthetic tools — no redirect needed
  if (
    /bot|crawl|spider|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|pingdom|googlebot|bingbot|yandex/i.test(
      ua
    )
  )
    return;
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
    if (!enPath && pathname.startsWith("/blog/")) {
      enPath = `/en${pathname}`;
    }
    if (!enPath) return;

    url.pathname = enPath;
    return Response.redirect(url.toString(), 302);
  }
}

export const config = {
  matcher: ["/((?!en/|admin|_vercel|.*\\..*).*)" ],
};
