/**
 * generate-sitemap.mjs
 * Reads published blog posts from Supabase and regenerates public/sitemap.xml.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-sitemap.mjs
 *   (or via:  npm run sitemap)
 *
 * Requires Node ≥ 20.6 (for --env-file flag).
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = "https://tattoolowkey.com";
const TODAY    = new Date().toISOString().split("T")[0];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  console.error("    Run:  node --env-file=.env.local scripts/generate-sitemap.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function hreflang(path) {
  const url = `${BASE_URL}${path}`;
  return [
    `    <xhtml:link rel="alternate" hreflang="es" href="${url}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${url}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>`,
  ].join("\n");
}

function urlBlock({ path, lastmod, changefreq, priority, imageLines = [] }) {
  const loc = `${BASE_URL}${path}`;
  const lines = [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    hreflang(path),
    ...imageLines,
    "  </url>",
  ];
  return lines.join("\n");
}

function imageBlock(imageLoc, title, caption) {
  return [
    "    <image:image>",
    `      <image:loc>${imageLoc}</image:loc>`,
    `      <image:title>${title}</image:title>`,
    `      <image:caption>${caption}</image:caption>`,
    "    </image:image>",
  ].join("\n");
}

// ── Static pages ──────────────────────────────────────────────────────────────
const BANNER = `${BASE_URL}/Banner_lowkeytattoo.jpg`;

const staticEntries = [
  urlBlock({
    path: "/",
    lastmod: TODAY,
    changefreq: "weekly",
    priority: "1.0",
    imageLines: [imageBlock(
      BANNER,
      "Lowkey Tattoo — Estudio de tatuajes en Santa Cruz de Tenerife",
      "Estudio de tatuajes y piercing profesional en Santa Cruz de Tenerife. Fine line, blackwork y geométrico."
    )],
  }),
  urlBlock({
    path: "/tatuajes-santa-cruz-tenerife",
    lastmod: TODAY,
    changefreq: "monthly",
    priority: "0.9",
    imageLines: [imageBlock(
      BANNER,
      "Tatuajes fine line y blackwork en Santa Cruz de Tenerife — Lowkey Tattoo",
      "Tatuajes personalizados en Santa Cruz de Tenerife. Especializados en fine line, blackwork y geométrico."
    )],
  }),
  urlBlock({ path: "/piercing-tenerife",                   lastmod: TODAY, changefreq: "monthly", priority: "0.8" }),
  urlBlock({ path: "/laser-eliminacion-tatuajes-tenerife", lastmod: TODAY, changefreq: "monthly", priority: "0.8" }),
  urlBlock({ path: "/blog",                                 lastmod: TODAY, changefreq: "weekly",  priority: "0.7" }),
];

// ── Fetch published posts from Supabase ───────────────────────────────────────
const { data: posts, error } = await supabase
  .from("blog_posts")
  .select("slug, updated_at, date")
  .eq("published", true)
  .order("date", { ascending: false });

if (error) {
  console.error("❌  Supabase query failed:", error.message);
  process.exit(1);
}

console.log(`✅  Found ${posts.length} published blog post(s)`);

const postEntries = posts.map((post, i) =>
  urlBlock({
    path: `/blog/${post.slug}`,
    lastmod: post.updated_at ? post.updated_at.split("T")[0] : (post.date ?? TODAY),
    changefreq: "yearly",
    priority: i === 0 ? "0.7" : "0.6",
  })
);

// ── Assemble XML ──────────────────────────────────────────────────────────────
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
  `        xmlns:xhtml="http://www.w3.org/1999/xhtml"`,
  `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
  ``,
  `  <!-- Home -->`,
  staticEntries[0],
  ``,
  `  <!-- Tatuajes -->`,
  staticEntries[1],
  ``,
  `  <!-- Piercing -->`,
  staticEntries[2],
  ``,
  `  <!-- Láser -->`,
  staticEntries[3],
  ``,
  `  <!-- Blog índice -->`,
  staticEntries[4],
  ``,
  `  <!-- Blog posts (${posts.length} publicados · generado ${TODAY}) -->`,
  ...postEntries,
  ``,
  `</urlset>`,
].join("\n");

// ── Write file ────────────────────────────────────────────────────────────────
const outPath = join(__dirname, "..", "public", "sitemap.xml");
writeFileSync(outPath, xml, "utf8");
console.log(`✅  Sitemap written → ${outPath}`);
