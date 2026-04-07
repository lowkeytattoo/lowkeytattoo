# Plan SEO #1 Tenerife — Lowkey Tattoo
**Dominio:** https://tattoolowkey.com  
**Objetivo:** Top 3 en "tatuajes santa cruz de tenerife" y variantes en 90 días  
**Última revisión:** 2026-04-03

---

## Diagnóstico de competencia

| Competidor | Fortaleza | Debilidad |
|---|---|---|
| santacruztattoo.net | 25+ años autoridad local | Sin blog, H1 genérico, sin keywords locales en title |
| voltgallerytattoo.com | Mejor on-page SEO, GTM | Sin blog, menos autoridad, dominio .com |
| Booksy / Fresha | Volumen de reseñas | No son estudio propio |
| blacklinesink.com | 6+ años, estilos variados | Sin contenido, estructura débil |

**Gap principal:** Ningún competidor tiene estrategia de contenido (blog). Es la mayor oportunidad.

---

## FASE 1 — Técnico (completado ✅)

### Páginas de servicios con URL propia
Google necesita URLs únicas para rankear cada servicio por separado.

| URL | Keyword principal | Estado |
|---|---|---|
| `/tatuajes-santa-cruz-tenerife` | tatuajes santa cruz de tenerife | ✅ |
| `/piercing-tenerife` | piercing tenerife | ✅ |
| `/laser-eliminacion-tatuajes-tenerife` | eliminación tatuajes láser tenerife | ✅ |
| `/blog` | blog tatuajes tenerife | ✅ |

### Meta tags por página (react-helmet-async)
Cada página con su propio `<title>` + `<meta description>` + Schema JSON-LD. ✅

### Schema markup mejorado en index.html
- LocalBusiness con dirección, horario, coordenadas
- AggregateRating preparado
- Servicios como `hasOfferCatalog`
✅

### Sitemap.xml actualizado
Incluye todas las páginas nuevas. ✅

### vercel.json — SPA routing
Todas las rutas redirigen a index.html. ✅

---

## FASE 2 — SEO Local (semana 2, pasos manuales)

### Google Business Profile — completar al 100%
- [ ] Fotos del estudio (mínimo 15, alta calidad)
- [ ] Fotos de trabajos recientes (actualizar mensual)
- [ ] Categoría principal: "Estudio de tatuajes"
- [ ] Categorías secundarias: "Estudio de piercing", "Clínica de eliminación de tatuajes con láser"
- [ ] Descripción de 750 caracteres con keywords locales
- [ ] Horario actualizado (incluyendo festivos)
- [ ] Servicios listados individualmente con precio orientativo
- [ ] URL del sitio: https://tattoolowkey.com
- [ ] Responder a TODAS las reseñas (positivas y negativas)

### Estrategia de reseñas (objetivo: 20+ en 30 días)
- Enviar WhatsApp a clientes satisfechos con link directo a reseña de Google
- Poner un cartel en el estudio con QR → link de reseña
- Pedir reseña verbalmente al acabar cada sesión
- **Nunca** ofrecer descuento a cambio de reseña (va contra políticas de Google)

### Google Search Console
- [ ] Verificar dominio `tattoolowkey.com` (método DNS o archivo HTML)
- [ ] Enviar sitemap: `https://tattoolowkey.com/sitemap.xml`
- [ ] Monitorizar errores de cobertura semanalmente

### Google Analytics 4
- [ ] Crear propiedad GA4 para `tattoolowkey.com`
- [ ] Añadir `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` en `.env.local` y en Vercel Environment Variables
- [ ] Verificar que los eventos de reserva se están registrando

### Directorios y citations locales (backlinks)
Cada listing es un backlink y una citation que refuerza la autoridad local:
- [ ] Páginas Amarillas: paginasamarillas.es
- [ ] Yelp España: yelp.es
- [ ] TripAdvisor
- [ ] Hotfrog.es
- [ ] Infoisinfo.es
- [ ] Kompass.com
- [ ] Tenerife Mapa / directorios locales canarios
- **Asegurarse de que Nombre, Dirección y Teléfono (NAP) son idénticos en todos**

---

## FASE 3 — Contenido (1-2 artículos/mes, efecto compuesto)

### Keywords de blog priorizadas por volumen/dificultad

| Artículo | Keyword | Búsquedas/mes España | Dificultad |
|---|---|---|---|
| ✅ Cuidados después de un tatuaje | "cuidados tatuaje reciente" | ~2.400 | Baja |
| ✅ ¿Cuánto cuesta un tatuaje en Tenerife? | "precio tatuaje tenerife" | ~800 | Muy baja |
| Siguiente → Estilos de tatuaje: guía completa | "estilos de tatuaje" | ~3.200 | Media |
| Siguiente → Piercing industrial Tenerife | "piercing industrial tenerife" | ~200 | Muy baja |
| Siguiente → Eliminación tatuajes láser: guía | "eliminar tatuaje laser" | ~1.800 | Media |
| Siguiente → Primera vez en un estudio de tatuajes | "que llevar al tatuaje" | ~600 | Baja |

### Estructura de cada artículo
- 800-1.200 palabras (no menos)
- H1 con keyword exacta
- H2s con variantes de keyword
- Al menos 1 imagen con alt text descriptivo
- Enlace interno a la página de servicio relacionada
- CTA al final: reservar cita

---

## FASE 4 — Link Building (mes 2-3)

- Contactar medios locales de Tenerife (Diario de Avisos, El Día) para colaboraciones/menciones
- Colaborar con influencers locales a cambio de tatuaje + mención
- Participar en eventos locales y conseguir menciones en web de organizadores
- Guest posts en blogs de lifestyle/cultura canaria

---

## Métricas a seguir (Search Console + GA4)

| Métrica | Objetivo 30 días | Objetivo 90 días |
|---|---|---|
| Posición media "tatuajes santa cruz" | Top 10 | Top 3 |
| Impresiones orgánicas/mes | 500+ | 2.000+ |
| Clics orgánicos/mes | 50+ | 300+ |
| Reseñas Google Business | 10+ | 25+ |
| Páginas indexadas | 6+ | 10+ |

---

## Configuración pendiente (.env.local)

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX     # Google Analytics 4
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX          # Opcional — Google Ads
VITE_META_PIXEL_ID=XXXXXXXXXXXXXXX       # Opcional — Meta Ads
```

Añadir las mismas variables en Vercel → Project Settings → Environment Variables.
