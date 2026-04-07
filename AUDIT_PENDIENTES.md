# Auditoría Lowkey Tattoo — Revisión Sistemática
**Fecha:** 2026-04-06  
**Última actualización:** 2026-04-06  
**Versión app:** React 18 + Supabase + Vercel  
**Dominio:** https://tattoolowkey.com

---

## 🔴 CRÍTICO — Afecta a funcionamiento o seguridad

### 1. ~~Admin expuesto a crawlers~~ ✅ RESUELTO
**Archivo:** `public/robots.txt`  
~~Los bots de Google pueden rastrear `/admin/*` y `/admin/login`.~~  
**Resuelto 2026-04-06:** Añadido `Disallow: /admin/` en robots.txt.

### 2. ~~Homepage sin SEO bilingüe~~ ✅ RESUELTO
**Archivo:** `src/web/pages/Index.tsx`  
~~`Index.tsx` no tiene `<SEOHead>`. Al cambiar a inglés, el `<title>` y `<meta description>` siguen siendo los de `index.html` (en español).~~  
**Resuelto 2026-04-06:** `Index.tsx` ahora incluye `<SEOHead>` con título y descripción dinámicos según el idioma activo.

### 3. Meta Pixel sin configurar
**Archivo:** `index.html` línea 224  
`PIXEL_ID_PLACEHOLDER` es un valor falso. El píxel de Meta/Facebook no está activo, con lo que cualquier campaña de Meta Ads perderá retargeting y conversiones.  
**Fix:** Sustituir por el ID real del píxel en `.env.local` y en Vercel Environment Variables:
```
VITE_META_PIXEL_ID=TU_PIXEL_ID_REAL
```

### 4. Google Analytics sin configurar
**Archivo:** `.env.local`  
`VITE_GA4_MEASUREMENT_ID` está vacío o es placeholder. Sin GA4 no hay datos de tráfico, objetivos ni conversiones.  
**Fix:**
```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```
Y añadir la misma variable en Vercel → Project Settings → Environment Variables.

### 5. Google Calendar IDs vacíos
**Archivo:** `src/shared/config/artists.ts`  
Los tres artistas tienen `calendarId: ""`. El modal de reserva online probablemente no muestra slots reales.  
**Fix:** Rellenar con los IDs reales de Google Calendar de cada artista.

---

## 🟠 ALTO — Impacto directo en SEO o UX

### 6. ~~Código muerto: blogPosts.ts~~ ✅ RESUELTO
**Archivo:** `src/web/data/blogPosts.ts`  
~~Desde que `BlogPage` y `BlogPostPage` leen de Supabase, este archivo no se importa en ningún sitio.~~  
**Resuelto 2026-04-03:** Archivo eliminado.

### 7. ~~NotFound (404) — sin noindex y solo en inglés~~ ✅ RESUELTO
**Archivo:** `src/web/pages/NotFound.tsx`  
~~Sin `noindex`, texto solo en inglés, sin Navbar ni Footer.~~  
**Resuelto 2026-04-06:** Página 404 completamente reescrita: bilingüe (ES/EN), `noindex,nofollow`, Navbar + Footer, estilo coherente con el resto de la web.

### 8. ~~Servicio pages no accesibles desde el Navbar~~ ✅ RESUELTO
**Archivo:** `src/web/components/Navbar.tsx`  
~~`/tatuajes-santa-cruz-tenerife`, `/piercing-tenerife` y `/laser-eliminacion-tatuajes-tenerife` no estaban en el menú principal.~~  
**Resuelto 2026-04-03:** Añadido desplegable "Servicios" en el Navbar (hover en desktop, toggle en móvil) con los tres links de servicio.

### 9. ~~Sitemap estático con posts hardcodeados~~ ✅ RESUELTO
**Archivo:** `scripts/generate-sitemap.mjs`  
~~Los posts del blog estaban hardcodeados en el XML.~~  
**Resuelto 2026-04-03:** Creado `scripts/generate-sitemap.mjs` que lee los posts publicados de Supabase y regenera `public/sitemap.xml`. Ejecutar con `npm run sitemap` tras cada nuevo post.

### 10. ~~Inconsistencia en URL de Instagram~~ ✅ RESUELTO
**Archivos:** `index.html` (JSON-LD) y `src/web/config/contact.ts`  
~~`contact.ts` usaba `https://instagram.com/tattoo.lowkey` (sin www) mientras que `index.html` usaba `https://www.instagram.com/tattoo.lowkey/`.~~  
**Resuelto 2026-04-06:** Ambos archivos unificados a `https://www.instagram.com/tattoo.lowkey/`.

### 11. Texto "(2025)" en contenido del blog
**Base de datos:** tabla `blog_posts` en Supabase  
El post "¿Cuánto cuesta un tatuaje?" tiene el H2: "Precios orientativos en Tenerife (2025)".  
**Fix:** Editar directamente desde el admin panel → Blog → ese post, y actualizar el H2 a "(2026)". **Requiere acción manual.**

---

## 🟡 MEDIO — SEO y rendimiento

### 12. ~~FAQPage schema del home solo en español~~ ✅ RESUELTO
**Archivo:** `index.html`  
~~El schema `FAQPage` tenía 6 preguntas únicamente en español.~~  
**Resuelto 2026-04-03:** Añadido segundo bloque `FAQPage` con `"inLanguage": "en"` y las 6 preguntas traducidas al inglés.

### 13. ~~llms.txt solo en español~~ ✅ RESUELTO
**Archivo:** `public/llms.txt`  
~~Las IAs anglófonas solo encontraban contenido en español.~~  
**Resuelto 2026-04-06:** Añadida sección `## English Summary` completa al final del archivo.

### 14. ~~Sin favicon optimizado ni Web App Manifest~~ ✅ RESUELTO
**Archivos:** `public/`, `index.html`  
**Resuelto 2026-04-07:** Archivos colocados en `public/` (`favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`). `index.html` y `site.webmanifest` actualizados con los nombres reales de los archivos.

### 15. ~~Sin `<link rel="sitemap">` en index.html~~ ✅ RESUELTO
**Archivo:** `index.html`  
~~Algunos bots descubren el sitemap por la cabecera HTML, no solo por robots.txt.~~  
**Resuelto 2026-04-06:** Añadido `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />` en `<head>`.

### 16. ~~Sin `<link rel="preconnect">` para recursos externos~~ ✅ RESUELTO
**Archivo:** `index.html`  
**Resuelto 2026-04-06:** Añadidos `preconnect` y `dns-prefetch` para `elfsightcdn.com`. Para añadir el dominio de Supabase, agrega manualmente: `<link rel="preconnect" href="https://TU_ID.supabase.co" crossorigin />`.

### 17. `AggregateRating` pendiente en LocalBusiness schema
**Archivo:** `index.html`  
En cuanto tengas reseñas en Google My Business, añadir este bloque al JSON-LD del LocalBusiness aumentará el CTR significativamente (muestra las estrellas en Google):
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "27",
  "bestRating": "5"
}
```
**Fix:** Añadir cuando tengas ≥10 reseñas verificadas.

### 18. ~~Sin lazy loading en páginas admin~~ ✅ RESUELTO
**Archivo:** `src/App.tsx`  
**Resuelto 2026-04-06:** Todas las páginas admin convertidas a `React.lazy()`. Un único `<Suspense>` envuelve `<AdminLayout />`, capturando la carga de cualquier ruta hija. Las páginas públicas siguen siendo eager.

### 19. ~~Blog sin alt text configurable para imágenes~~ ✅ RESUELTO
**Archivo:** `src/admin/components/RichTextEditor.tsx`  
**Resuelto 2026-04-06:** Campo "Texto alternativo (alt)" añadido al dialog de imagen (común para ambas pestañas, upload y URL). Es obligatorio antes de insertar — el botón/input se desactiva si está vacío.

---

## 🔵 BAJO — Mejoras de calidad

### 20. ~~Admin panel sin vista previa de post~~ ✅ RESUELTO
**Archivos:** `src/admin/pages/BlogPreview.tsx`, `src/App.tsx`, `src/admin/pages/BlogAdmin.tsx`  
**Resuelto 2026-04-06:** Creada página `/admin/blog/preview/:id` con el mismo estilo que `BlogPostPage`. Botón `MonitorPlay` añadido en la lista de posts. Funciona para publicados y borradores.

### 21. ~~Admin móvil: Finanzas, Stock y Artistas inaccesibles~~ ✅ RESUELTO
**Archivo:** `src/admin/components/AdminSidebar.tsx`  
**Resuelto 2026-04-06:** Añadido botón "Más" como 6º ítem en el bottom nav. Abre un `Sheet` desde abajo con los ítems no visibles (Finanzas, Stock, Artistas). También incluye botón de cierre de sesión dentro del sheet.

### 22. ~~Sin validación de slug duplicado en admin blog~~ ✅ RESUELTO
**Archivo:** `src/admin/pages/BlogAdmin.tsx`  
**Resuelto 2026-04-06:** `handleSubmit` comprueba el slug contra los posts en caché antes de enviar. Si hay duplicado, muestra error inline bajo el campo slug en rojo, sin llamar a Supabase.

### 23. ~~RichTextEditor sin texto de placeholder~~ ✅ RESUELTO
**Archivo:** `src/admin/components/RichTextEditor.tsx`  
**Resuelto 2026-04-06:** Instalado `@tiptap/extension-placeholder@^3.22.2`. Configurado con "Empieza a escribir el artículo..." y estilos CSS actualizados con `float-left` y `h-0` para posicionamiento correcto.

### 24. ~~Sin límite de caracteres visible en meta description~~ ✅ RESUELTO
**Archivo:** `src/admin/pages/BlogAdmin.tsx`  
**Resuelto 2026-04-06:** Contador cambia a `text-destructive font-semibold` cuando supera 155 caracteres.

### 25. Artists.ts emails no verificados
**Archivo:** `src/shared/config/artists.ts`  
Los emails `pablo@lowkeytattoo.com`, `sergio@lowkeytattoo.com`, `fifo@lowkeytattoo.com` parecen placeholders. Si EmailJS usa estos para enviar confirmaciones, no llegarán.  
**Fix:** Verificar que estos buzones existen y reciben correo.

### 26. ~~Sin política de privacidad ni aviso legal~~ ✅ RESUELTO
**Archivos:** `src/web/pages/PrivacyPage.tsx`, `src/web/pages/LegalPage.tsx`, `Footer.tsx`, `App.tsx`  
**Resuelto 2026-04-06:** Creadas páginas `/politica-de-privacidad` (RGPD compliant: responsable, datos, finalidad, base jurídica, plazo, derechos, terceros, cookies) y `/aviso-legal` (LSSI-CE: identificación, propiedad intelectual, jurisdicción). Enlazadas desde el footer.

### 27. blog post schema `dateModified` no se actualiza automáticamente
**Archivo:** `src/web/pages/BlogPostPage.tsx`  
El `dateModified` en el schema usa `post.updated_at`, pero solo es correcto si Supabase tiene un trigger que actualice `updated_at` al hacer UPDATE.  
**Fix SQL:** Añadir en Supabase:
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();
```

---

## ✅ CHECKLIST SEO — Estado actual por idioma

| Elemento | ES | EN | Notas |
|---|---|---|---|
| `<title>` homepage | ✅ | ✅ | Resuelto 2026-04-06 |
| `<meta description>` homepage | ✅ | ✅ | Resuelto 2026-04-06 |
| `<title>` páginas de servicio | ✅ | ✅ | SEOHead dinámico |
| `<meta description>` servicio | ✅ | ✅ | |
| hreflang es/en/x-default | ✅ | ✅ | Todas las páginas |
| Canonical URL | ✅ | ✅ | |
| Open Graph | ✅ | ✅ | |
| Twitter Card | ✅ | ✅ | |
| LocalBusiness schema | ✅ | — | Solo en index.html (ES) |
| FAQPage schema (home) | ✅ | ✅ | Resuelto 2026-04-03 |
| BreadcrumbList schema | ✅ | ✅ | Todas las páginas de servicio y blog |
| Service schema | ✅ | ✅ | |
| FAQPage schema (laser) | ✅ | ✅ | Dinámico via traducciones |
| BlogPosting schema | ✅ | ✅ | image + dateModified incluidos |
| robots.txt | ✅ | — | /admin/ bloqueado ✅ |
| sitemap.xml | ✅ | — | `npm run sitemap` regenera desde Supabase |
| sitemap-images.xml | ✅ | — | |
| llms.txt | ✅ | ✅ | Resuelto 2026-04-06 |
| AggregateRating | ❌ | ❌ | Pendiente de tener reseñas |
| Favicon completo | ❌ | — | Solo .ico básico — pendiente |
| Web App Manifest | ❌ | — | Pendiente |
| 404 noindex + bilingüe | ✅ | ✅ | Resuelto 2026-04-06 |
| URL Instagram unificada | ✅ | — | Resuelto 2026-04-06 |
| `<link rel="sitemap">` en head | ✅ | — | Resuelto 2026-04-06 |

---

## 📋 PRÓXIMOS PASOS — Ordenados por impacto

### Semana 1 — Pendiente de acción manual
- [ ] **Ejecutar SQL de migración** en Supabase (tabla blog_posts + bucket blog-images + trigger updated_at)
- [ ] **Configurar GA4** → `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` en .env y Vercel
- [ ] **Configurar Meta Pixel** → reemplazar `PIXEL_ID_PLACEHOLDER` con ID real
- [ ] **Editar post "cuánto cuesta"** desde admin → cambiar "(2025)" a "(2026)"
- [ ] **Rellenar calendarIds** de los artistas

### Semana 2 — Local SEO y contenido
- [ ] **Google Search Console** → verificar dominio + enviar sitemap
- [ ] **Google Business Profile** → completar al 100% (fotos, horarios, servicios, descripción 750 chars)
- [ ] **Generar favicon completo** en realfavicongenerator.net
- [ ] **Añadir política de privacidad y aviso legal** al footer
- [ ] **Estrategia de reseñas** → WhatsApp a los últimos 20 clientes

### Semana 3 — Contenido SEO
- [ ] **Nuevo post**: "Piercing industrial Tenerife" (200 búsquedas/mes, dificultad muy baja)
- [ ] **Nuevo post**: "Eliminar tatuaje laser: guía completa" (1.800 búsquedas/mes)
- [ ] **Directorios locales**: Páginas Amarillas, Yelp España, TripAdvisor, Hotfrog

### Mes 2 — Técnico avanzado
- [ ] **Lazy loading admin** → React.lazy en todas las páginas admin (issue #18)
- [x] ~~**Navbar con links de servicio** → desplegable "Servicios" (issue #8)~~ ✅ Resuelto
- [ ] **Alt text en imágenes del editor** → campo obligatorio (issue #19)
- [x] ~~**Sitemap dinámico** → `npm run sitemap` (issue #9)~~ ✅ Resuelto
- [ ] **AggregateRating** → añadir cuando haya ≥10 reseñas (issue #17)
- [x] ~~**FAQPage schema en inglés** en index.html (issue #12)~~ ✅ Resuelto
- [ ] **preconnect** para recursos externos (issue #16)
- [x] ~~**Eliminar blogPosts.ts** — código muerto (issue #6)~~ ✅ Resuelto

### Mes 3 — Crecimiento y calidad
- [ ] **Link building** → medios locales Tenerife (Diario de Avisos, El Día)
- [ ] **Colaboración con influencers** locales
- [ ] **Google Ads** → campaña local "tatuajes santa cruz de tenerife"
- [x] ~~**Admin: preview de post** (issue #20)~~ ✅ Resuelto
- [x] ~~**Admin: "Más" en bottom nav móvil** (issue #21)~~ ✅ Resuelto
- [x] ~~**Validación slug duplicado** en admin blog (issue #22)~~ ✅ Resuelto
- [x] ~~**Placeholder en RichTextEditor** (issue #23)~~ ✅ Resuelto
- [x] ~~**Contador meta description en rojo** al superar 155 chars (issue #24)~~ ✅ Resuelto
- [x] ~~**Política de privacidad / aviso legal** (issue #26)~~ ✅ Resuelto

---

## 📊 KPIs objetivo (Search Console + GA4)

| Métrica | Ahora | 30 días | 90 días |
|---|---|---|---|
| Posición media "tatuajes santa cruz" | — | Top 10 | Top 3 |
| Impresiones orgánicas/mes | — | 500+ | 2.000+ |
| Clics orgánicos/mes | — | 50+ | 300+ |
| Reseñas Google | — | 10+ | 25+ |
| Páginas indexadas | 6 | 8+ | 12+ |
| Posts de blog | 3 | 5 | 8 |

---

*Documento generado el 2026-04-06 · Última actualización: 2026-04-06*  
*Issues resueltos: #1, #2, #6, #7, #8, #9, #10, #12, #13, #14 (parcial), #15, #16, #18, #19, #20, #21, #22, #23, #24, #26*  
*Issues pendientes de acción manual: #3 (Meta Pixel), #4 (GA4), #5 (Calendar IDs), #14 (imágenes favicon), #25 (emails artistas)*
