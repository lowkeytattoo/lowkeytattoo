# REVISIÓN EXHAUSTIVA — LOWKEY TATTOO
> Generado: 2026-04-07

---

## BUGS CRÍTICOS A CORREGIR

### 1. FAQPage duplicado en LaserPage
`src/web/pages/LaserPage.tsx:34-41` genera su propio schema `FAQPage` con las 4 FAQs del láser. Como `index.html` siempre contiene el FAQPage global (12 preguntas), cuando Google renderiza `/laser-eliminacion-tatuajes-tenerife` ve **dos FAQPage en el mismo documento** — exactamente el mismo error que acabamos de corregir. Opciones:
- **A (recomendada):** Mover las 4 FAQs del láser al FAQPage global de `index.html`
- **B:** Eliminar el FAQPage de `LaserPage.tsx` y asumir que el global cubre el láser

### 2. `PIXEL_ID_PLACEHOLDER` sin reemplazar
`index.html:297` — el `<noscript>` del Meta Pixel todavía contiene `PIXEL_ID_PLACEHOLDER`. No afecta el tracking (que va por `analytics.ts`), pero si alguien inspecciona el HTML parece inacabado. Necesita el ID real o eliminarse hasta tener el Pixel.

### 3. `calendarId: ""` en los 3 artistas
`src/shared/config/artists.ts:15,21,27` — Los tres artistas tienen `calendarId: ""`. El modal de reserva paso 2 (`DateTimeStep`) usa este ID para fetchear disponibilidad de Google Calendar. Sin IDs reales, el selector de fechas no puede mostrar slots disponibles. El sistema de reservas online está roto para los 3 artistas.

### 4. Emails de artistas no verificados
`artists.ts` usa `pablo@lowkeytattoo.com`, `sergio@lowkeytattoo.com`, `fifo@lowkeytattoo.com`. La función `sendBookingRequest` envía confirmaciones a `artistEmail`. Si estos mailboxes no existen, los artistas nunca reciben notificaciones de reservas web.

---

## WEB PÚBLICA

### Estado actual ✅
- Arquitectura SEO sólida: title/description/canonical/OG/Twitter/hreflang en todas las páginas vía `SEOHead`
- Schemas correctos: LocalBusiness + WebSite + FAQPage (global), Service + BreadcrumbList por página de servicio, BlogPosting + BreadcrumbList en posts
- Estructura de URLs semántica: `/tatuajes-santa-cruz-tenerife`, `/piercing-tenerife`, `/laser-eliminacion-tatuajes-tenerife`, `/blog/[slug]`
- Cookie banner con Consent Mode v2 (RGPD compliant)
- Legal: `/politica-de-privacidad` y `/aviso-legal` presentes
- Footer: enlaces legales, links internos a todos los servicios
- Navbar: dropdown de servicios en desktop, acordeón en mobile, selector de idioma
- Booking modal: 4 pasos (artista → fecha/hora → detalles → confirmación), animaciones, tracking GA4

### Gaps y mejoras

**Inmediatas:**
- **TatuajesPage sin FAQPage schema** — LaserPage sí tiene uno, TatuajesPage no. Añadir 4-6 preguntas frecuentes (¿cuánto tarda?, ¿duele?, ¿qué debo llevar?) mejoraría las rich results para la página con más volumen de búsqueda
- **PiercingPage sin FAQPage schema** — igual que arriba
- **Imágenes de servicio sin `width`/`height`** — `gallery4.jpg` y `laser_lowkey.jpg` se cargan con `loading="eager"` pero sin dimensiones explícitas, causando CLS (Cumulative Layout Shift)
- **Blog: solo 3 posts** — el sitemap declara `changefreq: weekly` pero no hay contenido nuevo. Google penaliza el crawl budget cuando el freshness prometido no se cumple. O se actualiza frecuentemente o se cambia a `monthly`

**A medio plazo:**
- **Galería sin lazy loading de imágenes individuales** — si la galería crece, todas las imágenes cargan en el render inicial
- **No hay sección de reseñas/testimonios** — elemento de confianza clave para conversiones. Aunque se use Google Reviews embebido, algo mínimo en la home
- **Blog sin paginación** — cuando haya >20 posts, cargar todos en una lista sin paginación es ineficiente
- **Sin `og:image` per-page** — todas las páginas usan el mismo `Banner_lowkeytattoo.jpg`. Los posts del blog deberían usar su imagen de portada en OG
- **Formulario de contacto directo ausente** — solo existe el modal de reserva de 4 pasos y el WhatsApp. Un formulario simple en el footer o en una página de contacto reduciría fricción para consultas rápidas

---

## PANEL ADMIN

### Sessions ✅
Muy completo: filtros por fecha/tipo/artista, resumen financiero en la cabecera, toggle de pago inline, formulario completo.

**Gaps:**
- Sin **delete session** — solo se puede editar. Las sesiones canceladas/erróneas quedan contaminando los datos financieros
- `duration_minutes` existe en el tipo `Session` pero no aparece en el formulario — útil para calcular utilización de agenda
- Sin **búsqueda por cliente** en la lista — con volumen alto hay que scrollear para encontrar sesiones de un cliente específico

### Clients ✅
Búsqueda, filtro por artista, cover photo thumbnail en lista, navegación a perfil.

**Gaps:**
- Sin **exportar clientes a CSV** (Finances sí tiene export pero Clients no)
- Sin **campo birthday** en el formulario de creación (existe en el tipo pero no se muestra ni al crear ni al editar)
- Sin **contador de sesiones** en la lista — no se ve a golpe de vista cuántas sesiones tiene cada cliente

### ClientProfile ✅
El más completo: fotos con conversión WebP automática (1920px max, 0.85 quality), signed URLs, lightbox, historial de sesiones, edición inline, alergias.

**Gaps:**
- Sin **delete photo** — se puede subir y marcar como portada, pero no eliminar
- Sin **birthday field** en el formulario de edición
- Sin **enlace directo a sesión** desde el historial (ver/editar la sesión sin ir a Sessions)
- `supabase.from("client_photos").select()` está inline en el componente en vez de en un hook — inconsistente con el resto del codebase

### Finances ✅
KPIs, gráfico de barras apilado por artista, listado de impagados, CSV export, tabs por artista para owner.

**Gaps:**
- Sin **comparativa mes anterior** — los KPIs muestran totales del filtro activo, no un periodo concreto con comparativa
- Sin **generación de factura/recibo** — útil para clientes que necesitan justificante
- El CSV exporta todo sin respetar filtros aplicados (siempre todas las sesiones del artista activo, no el rango de fechas seleccionado)

### Stock ✅
Grid de productos con barra de progreso, filtros por categoría, historial de movimientos, create/delete para owner.

**Gaps:**
- **Sin "entrada" (restock)** — solo existe "registrar uso" (salida). El owner no puede añadir stock desde la UI sin acceder directamente a Supabase. Es el gap más crítico de este módulo
- Sin **alerta activa** para productos en estado "Bajo" o "Agotado" — hay badges visuales pero no notificaciones ni resumen en el Dashboard
- El botón de delete usa `confirm()` nativo del browser, inconsistente con el design system

### Artists
Gestión de perfiles con cards, edición de nombre/rol/artist_config_id.

**Gaps:**
- Sin **avatar upload** desde esta página — el campo `avatar_url` existe en el perfil pero no hay forma de cambiarlo desde el admin
- Sin **invitación a nuevos artistas** — para añadir un nuevo miembro hay que crear el usuario directamente en Supabase Dashboard

### BlogAdmin ✅
Editor TipTap con placeholder, validación de slug duplicado, contador de meta description, preview.

**Gaps:**
- Sin **gestión de tags** centralizada — si los tags son campos de texto libre, no hay consistencia entre posts
- Sin **programación de publicación** — solo existe publicado/borrador, no una fecha futura de publicación automática
- Sin **imagen OG específica por post** — todos los posts comparten el mismo banner en OG

### WebBookings ✅
Lista de reservas web, gestión de estado, conversión a sesión con auto-creación de cliente.

**Gaps:**
- Sin **notificación en tiempo real** — cuando llega una nueva reserva web el equipo no recibe aviso (ni email, ni badge en sidebar). Hay que entrar al admin a revisar manualmente
- Sin **filtros** en la lista de reservas
- El sidebar del admin no muestra un badge de "reservas pendientes" — hay que navegar a WebBookings para saberlo

### Dashboard
KPIs (revenue, sesiones, clientes, pendientes), gráfico de ingresos, últimas 10 sesiones.

**Gaps:**
- Sin **widget de reservas web pendientes** — una de las métricas más importantes del día a día no está visible
- Sin **selector de periodo** para los KPIs (¿totales de siempre? ¿mes actual?)
- Sin **alertas de stock** — los productos en rojo/amarillo no aparecen en el dashboard

---

## SEO / ANALYTICS

### Estado actual ✅
- GA4 (G-TWXC2L3LQJ) funcionando con Consent Mode v2
- Search Console configurado, DNS verification pendiente (hasta 5 días)
- Sitemap enviado con 8 URLs
- Indexación solicitada para las 4 URLs principales
- Schemas completos y sin errores (post fix de FAQPage duplicado)
- hreflang en todas las páginas
- Canonical en todas las páginas
- llms.txt presente

### Próximos pasos por prioridad

**Semana 1-2 (pendiente):**
- [ ] Confirmar verificación DNS en Search Console
- [ ] Reemplazar `PIXEL_ID_PLACEHOLDER` con ID real (o eliminar) una vez configurado Meta Pixel
- [ ] Corregir FAQPage duplicado en LaserPage

**Mes 1 (alto impacto):**
- [ ] **Google Business Profile** — impacto más grande para búsquedas locales "tatuajes cerca de mí" / "tatuajes Santa Cruz". Incluir fotos de alta calidad, horario, categoría (Tattoo shop), enlace a web, activar mensajes
- [ ] Añadir FAQPage schema a TatuajesPage y PiercingPage
- [ ] Añadir `og:image` específica por post de blog
- [ ] Crear 2 posts de blog nuevos (ver estrategia de contenido abajo)

**Mes 2-3:**
- [ ] Solicitar primeras reseñas en Google (pedirlo en persona al terminar cada sesión)
- [ ] Añadir `LocalBusiness` → `aggregateRating` al schema cuando haya reseñas
- [ ] Linkbuilding: directorio de estudios de tatuaje de Canarias, menciones en Instagram de clientes

### Estrategia de contenido — blog
| Post | Intención | Prioridad |
|------|-----------|-----------|
| "Cuánto duele un tatuaje: zonas del cuerpo ordenadas por dolor" | Informacional / alto volumen | 🔴 |
| "Fine line vs blackwork: cuál elegir para tu primer tatuaje" | Informacional / long tail | 🔴 |
| "Cómo prepararse para una sesión de eliminación láser de tatuajes" | Intención de servicio | 🟠 |
| "Piercing tragus vs daith: diferencias, cuidados y precios en Tenerife" | Geolocalizado | 🟠 |
| "Ideas de tatuajes pequeños para mujer: fine line en Tenerife" | Alta conversión | 🟡 |

---

## TÉCNICO

### Performance
- Bundle admin lazy-loaded correctamente (React.lazy + Suspense) ✅
- WebP conversion en ClientProfile (1920px max, 0.85 quality) ✅
- Elfsight async script (no bloquea render) ✅
- Preconnect a elfsightcdn.com en index.html ✅

**Gaps:**
- Sin **image optimization** para assets de `src/assets/` (gallery-1...4.jpg, laser_lowkey.jpg) — si son imágenes grandes sin comprimir impactan el LCP
- Sin **Service Worker / PWA offline** — el manifest existe pero sin SW no hay caché offline
- Recharts (Finances chart) se importa completo — se podría hacer lazy para reducir el bundle del admin

### Seguridad
- Signed URLs para fotos privadas de clientes (1h TTL) ✅
- Consent Mode v2 antes de inicializar analytics ✅
- No hay secretos hardcoded en el código fuente ✅

**Gaps:**
- Sin **rate limiting** en el endpoint de booking — si `sendBookingRequest` llama a una serverless function, debería tener protección contra spam
- El botón de delete en Stock usa `confirm()` — si el nombre del producto viniese de input externo sin sanitizar podría ser vector XSS (bajo riesgo con datos de Supabase, pero vale la pena tipificarlo)

### Deuda técnica
- `(s.client as any)` y `(s.artist as any)` repetidos en `Sessions.tsx`, `Finances.tsx` — el tipo `Session` debería tener las relaciones tipadas en lugar de cast a `any`
- `format(new Date(s.date + "T00:00:00"), ...)` — el fix de timezone está repetido en `Sessions.tsx`, `ClientProfile.tsx` y `Finances.tsx` sin un helper compartido
- `handleCreateSession` en ClientProfile no tiene manejo de error visible para el usuario
- Hook de fotos inline en `ClientProfile.tsx` — debería extraerse a `useClients` o hook propio

---

## RESUMEN DE PRIORIDADES

| Prioridad | Acción | Área |
|-----------|--------|------|
| 🔴 Crítico | Rellenar `calendarId` de los 3 artistas | Booking online |
| 🔴 Crítico | Verificar emails de artistas | Notificaciones |
| 🔴 Crítico | Corregir FAQPage duplicado en LaserPage | SEO |
| 🟠 Alto | Añadir "entrada" (restock) en Stock | Admin |
| 🟠 Alto | Google Business Profile | SEO local |
| 🟠 Alto | Reemplazar `PIXEL_ID_PLACEHOLDER` | Analytics |
| 🟠 Alto | Badge "reservas pendientes" en sidebar/dashboard | Admin UX |
| 🟡 Medio | FAQPage en TatuajesPage + PiercingPage | SEO |
| 🟡 Medio | Delete session + delete photo en ClientProfile | Admin |
| 🟡 Medio | 2 nuevos posts de blog | SEO / contenido |
| 🟡 Medio | `og:image` específica por post de blog | Social SEO |
| 🟢 Bajo | Primer lote de reseñas Google | Credibilidad |
| 🟢 Bajo | Tipar relaciones `session.client` / `session.artist` | Código |
| 🟢 Bajo | Helper compartido para format de fechas | Código |
