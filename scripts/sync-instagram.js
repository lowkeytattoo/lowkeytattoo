#!/usr/bin/env node
/**
 * sync-instagram.js
 *
 * Sincroniza el feed de Instagram con la web.
 *
 * ─── MODO MANUAL (sin token) ────────────────────────────────────────────────
 *
 *  1. Pon las imágenes en:  scripts/posts/
 *  2. Edita los textos en:  scripts/posts/captions.json
 *  3. Ejecuta:              npm run instagram
 *
 *  El script copia las imágenes a src/assets/instagram/
 *  y regenera src/data/instagramFeed.ts automáticamente.
 *
 * ─── MODO API (cuando tengas el token) ──────────────────────────────────────
 *
 *  1. Añade en .env:        VITE_INSTAGRAM_TOKEN=tu_token_aqui
 *  2. Ejecuta:              npm run instagram
 *
 *  El script descarga las últimas fotos de Instagram,
 *  las guarda en src/assets/instagram/ y actualiza instagramFeed.ts.
 *
 *  Para obtener el token:
 *    - https://developers.facebook.com → tu app → Instagram Basic Display
 *    - Long-lived token dura 60 días; renuévalo con:
 *      GET https://graph.instagram.com/refresh_access_token
 *           ?grant_type=ig_refresh_token&access_token=TOKEN
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, "..");
const POSTS_DIR  = path.join(__dirname, "posts");
const ASSETS_DIR = path.join(ROOT, "src", "assets", "instagram");
const OUTPUT     = path.join(ROOT, "src", "data", "instagramFeed.ts");
const INSTAGRAM_PROFILE = "https://www.instagram.com/tattoo.lowkey/";
const MAX_POSTS  = 9; // Número máximo de posts a mostrar en la web

// ─── Helpers ────────────────────────────────────────────────────────────────

function readEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, "utf-8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const [k, ...v] = l.split("=");
        return [k.trim(), v.join("=").trim().replace(/^["']|["']$/g, "")];
      })
  );
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function generateTs(posts) {
  const imports = posts
    .map((p, i) => `import post${i + 1} from "@/assets/instagram/${p.filename}";`)
    .join("\n");

  const entries = posts
    .map(
      (p, i) => `  {
    id: ${JSON.stringify(p.id)},
    caption: ${JSON.stringify(p.caption)},
    media_type: "IMAGE",
    media_url: post${i + 1},
    permalink: ${JSON.stringify(p.permalink)},
    timestamp: ${JSON.stringify(p.timestamp)},
  }`
    )
    .join(",\n");

  return `/**
 * ⚠️  ARCHIVO GENERADO AUTOMÁTICAMENTE
 * No lo edites a mano. Usa:  npm run instagram
 *
 * Generado: ${new Date().toISOString()}
 */

import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
${imports ? "\n" + imports : ""}

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: MediaType;
  media_url: string;
  permalink: string;
  timestamp: string;
}

export const staticPosts: InstagramPost[] = [
${entries}
];
`;
}

function generateTsFromStatic(posts) {
  const imports = posts
    .map((p, i) => `import post${i + 1} from "@/assets/instagram/${p.filename}";`)
    .join("\n");

  const entries = posts
    .map(
      (p, i) => `  {
    id: ${JSON.stringify(p.id)},
    caption: ${JSON.stringify(p.caption)},
    media_type: "IMAGE",
    media_url: post${i + 1},
    permalink: ${JSON.stringify(p.permalink)},
    timestamp: ${JSON.stringify(p.timestamp)},
  }`
    )
    .join(",\n");

  return `/**
 * ⚠️  ARCHIVO GENERADO AUTOMÁTICAMENTE
 * No lo edites a mano. Usa:  npm run instagram
 *
 * Generado: ${new Date().toISOString()}
 */
${imports ? "\n" + imports + "\n" : ""}
export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: MediaType;
  media_url: string;
  permalink: string;
  timestamp: string;
}

export const staticPosts: InstagramPost[] = [
${entries}
];
`;
}

// ─── Modo Manual ─────────────────────────────────────────────────────────────

async function syncManual() {
  console.log("📁  Modo manual — leyendo scripts/posts/\n");

  const captionsPath = path.join(POSTS_DIR, "captions.json");
  if (!fs.existsSync(captionsPath)) {
    console.error("❌  No se encontró scripts/posts/captions.json");
    console.error("    Crea el archivo siguiendo el ejemplo en scripts/posts/captions.example.json");
    process.exit(1);
  }

  const captions = JSON.parse(fs.readFileSync(captionsPath, "utf-8"));
  const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const imageFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
    .sort();

  if (imageFiles.length === 0) {
    console.error("❌  No hay imágenes en scripts/posts/");
    console.error("    Pon las fotos (jpg, png, webp) en esa carpeta.");
    process.exit(1);
  }

  // Asegura que existe el directorio de destino
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const posts = [];

  for (const file of imageFiles.slice(0, MAX_POSTS)) {
    const src  = path.join(POSTS_DIR, file);
    const dest = path.join(ASSETS_DIR, file);
    fs.copyFileSync(src, dest);

    const meta = captions.find((c) => c.file === file) ?? {};
    posts.push({
      id:        `manual_${slugify(path.parse(file).name)}`,
      filename:  file,
      caption:   meta.caption  ?? "",
      permalink: meta.permalink ?? INSTAGRAM_PROFILE,
      timestamp: meta.timestamp ?? new Date().toISOString(),
    });

    console.log(`  ✓  ${file}`);
  }

  fs.writeFileSync(OUTPUT, generateTsFromStatic(posts), "utf-8");
  console.log(`\n✅  ${posts.length} posts sincronizados → src/data/instagramFeed.ts`);
}

// ─── Modo API ────────────────────────────────────────────────────────────────

async function syncApi(token) {
  console.log("🌐  Modo API — descargando feed de Instagram…\n");

  const FIELDS = "id,caption,media_type,media_url,permalink,timestamp";
  const url    = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${MAX_POSTS}&access_token=${token}`;

  let data;
  try {
    const json = await fetchJson(url);
    if (json.error) {
      console.error("❌  Error de la API de Instagram:", json.error.message);
      process.exit(1);
    }
    data = json.data ?? [];
  } catch (err) {
    console.error("❌  No se pudo conectar con la API de Instagram:", err.message);
    process.exit(1);
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const posts = [];

  for (const post of data) {
    if (post.media_type === "VIDEO") continue; // omitir vídeos

    const ext      = ".jpg";
    const filename = `${post.id}${ext}`;
    const dest     = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(dest)) {
      process.stdout.write(`  ↓  Descargando ${filename}…`);
      await download(post.media_url, dest);
      process.stdout.write(" ✓\n");
    } else {
      console.log(`  ✓  ${filename} (ya existe)`);
    }

    posts.push({
      id:        post.id,
      filename,
      caption:   post.caption   ?? "",
      permalink: post.permalink ?? INSTAGRAM_PROFILE,
      timestamp: post.timestamp ?? new Date().toISOString(),
    });
  }

  fs.writeFileSync(OUTPUT, generateTsFromStatic(posts), "utf-8");
  console.log(`\n✅  ${posts.length} posts sincronizados → src/data/instagramFeed.ts`);
  console.log("   Recuerda renovar el token cada 60 días.");
}

// ─── Main ────────────────────────────────────────────────────────────────────

const env   = readEnv();
const token = env.VITE_INSTAGRAM_TOKEN || process.env.VITE_INSTAGRAM_TOKEN;

if (token) {
  syncApi(token).catch((err) => { console.error(err); process.exit(1); });
} else {
  syncManual().catch((err) => { console.error(err); process.exit(1); });
}
