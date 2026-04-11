# REVISIÓN EXHAUSTIVA — LOWKEY TATTOO
> Generado: 2026-04-07 · Última actualización: 2026-04-11

---

## REVISIÓN CÓDIGO — 2026-04-11

Revisión exhaustiva del código fuente completo. Se inspeccionaron todos los hooks, contextos, páginas admin y componentes web.

### 🔴 NUEVOS BUGS CRÍTICOS

#### A. `useClients` ignora el parámetro `artistId` — fuga de datos ✅ RESUELTO
**Archivo:** `src/admin/hooks/useClients.ts`

Aplicado filtro `.eq("primary_artist_id", artistId)` en el query de Supabase. Además, `Clients.tsx` ahora pasa `profile?.id` como `artistId` cuando el usuario no es owner, de forma que los artistas solo ven sus propios clientes a nivel de datos (no solo UI). Tipos actualizados a `ClientWithArtist` eliminando todos los casts `as any`.

#### B. Actualización de stock no atómica — condición de carrera ✅ RESUELTO
**Archivo:** `src/admin/hooks/useStock.ts`

Trigger `trg_stock_movement_qty` creado en Supabase. El `AFTER INSERT ON stock_movements` actualiza `products.quantity` atómicamente en la BD. Eliminado el código de read-modify-write del cliente — `useCreateStockMovement` ahora solo inserta el movimiento y la BD hace el resto.

### 🟠 NUEVOS BUGS ALTOS

#### C. Signed URLs de fotos privadas expiran en 1h — imágenes rotas en cache ✅ RESUELTO
**Archivo:** `src/admin/hooks/useClients.ts`

Añadido `staleTime: 50 * 60 * 1000` (50 minutos) en `useClientPhotos` y `useClientCoverPhotos`. React Query refrescará las URLs antes de que caduquen.

#### D. `ProtectedRoute` no verifica existencia de perfil ✅ RESUELTO
**Archivo:** `src/admin/components/ProtectedRoute.tsx`

Ahora verifica `!user || !profile`. Un usuario con sesión de auth pero sin perfil en `profiles` es redirigido al login.

#### E. Race condition en `AdminAuthContext` ✅ RESUELTO
**Archivo:** `src/admin/contexts/AdminAuthContext.tsx`

Eliminada la llamada inicial a `getSession()`. Supabase v2 dispara `INITIAL_SESSION` a través de `onAuthStateChange` al registrarse, por lo que el estado inicial se gestiona correctamente desde un único listener.

#### F. `fetchProfile` sin manejo de errores ✅ RESUELTO
**Archivo:** `src/admin/contexts/AdminAuthContext.tsx`

Añadido estado `error: string | null` al contexto. `fetchProfile` ahora llama a `setError(error.message)` si Supabase devuelve un error. Los consumidores pueden usar `error` para mostrar mensajes de fallo en lugar de quedarse con pantalla en blanco.

### 🟡 NUEVOS BUGS MEDIOS

#### G. Sin feedback de error en mutaciones del admin ✅ RESUELTO
**Archivos:** `src/admin/pages/Clients.tsx`, `src/admin/pages/Stock.tsx`

`handleCreate` y `handleUsage` envueltos en `try/catch`. En caso de error, se muestra un `toast.error()` con mensaje descriptivo. El diálogo permanece abierto para que el usuario pueda reintentar.

#### H. `useFinancesOverview` descarga todo el historial de sesiones ✅ RESUELTO
**Archivo:** `src/admin/hooks/useFinances.ts`

Refactorizado en dos queries separados con filtros en BD: uno para el mes actual (`.gte`/`.lte` por fecha) y otro para impagados (`.eq("paid", false)`). Ya no se descarga ni filtra en cliente el historial completo.

#### I. `trackCtaClick` envía evento Meta Pixel sin verificar consentimiento ✅ RESUELTO
**Archivo:** `src/web/lib/analytics.ts`

Añadida función interna `hasConsent()` que lee `localStorage.getItem("lowkey-consent")`. La llamada `fbq("track", "Contact")` ahora solo se ejecuta si `hasConsent()` devuelve `true`.

#### J. Casts `as any` en datos de Supabase con joins ✅ RESUELTO
**Archivos:** `src/shared/types/index.ts`, `src/admin/hooks/useSessions.ts`, `src/admin/hooks/useClients.ts`, `src/admin/pages/Dashboard.tsx`, `src/admin/pages/Clients.tsx`

Añadidos tipos `SessionWithRelations` y `ClientWithArtist` en `shared/types/index.ts`. Los hooks `useSessions` y `useClients` castean el resultado al tipo correcto. `Dashboard.tsx` y `Clients.tsx` ya acceden a `.client?.name`, `.artist?.display_name` y `.primary_artist?.display_name` sin ningún `as any`.

### 🟢 NUEVOS ITEMS DE CALIDAD

#### K. `blog_posts` no está en el tipo `Database` ✅ RESUELTO
Añadida interfaz `BlogPost` y entrada `blog_posts` en el tipo `Database` de `src/shared/types/index.ts`. El cliente de Supabase ahora tiene tipado completo para esta tabla.

#### L. `confirm()` del navegador para confirmar eliminación de producto ✅ RESUELTO
`src/admin/pages/Stock.tsx` — Reemplazado `window.confirm()` por un `AlertDialog` de shadcn/ui con botones "Cancelar" y "Eliminar", integrado con el design system.

#### M. Sin paginación en la lista de clientes ✅ RESUELTO
Nuevo hook `useClientsPaged` en `useClients.ts` con paginación y búsqueda server-side (Supabase `.range()` + `.or()` con `ilike`). `Clients.tsx` refactorizado: búsqueda con debounce de 300ms, filtro por artista integrado en la query, controles Anterior/Siguiente con contador "X–Y de Z". `useClients` sin paginar se mantiene para los dropdowns de Sessions y WebBookings.

#### N. `useAdminAuth.ts` es un re-export de una sola línea ⚠️ PENDIENTE (bajo impacto)
Sin cambios — el archivo no causa bugs, solo es una indirección innecesaria.

#### O. `calendarId` vacío — disponibilidad no real ⚠️ PENDIENTE
El `DateTimeStep` ya muestra un aviso cuando `calendarUnavailable` es `true` (componente con `AlertCircle`). Requiere rellenar los `calendarId` reales en `artists.ts`.

---

## BUGS CRÍTICOS (histórico)

### 1. FAQPage duplicado en LaserPage ✅ RESUELTO
`LaserPage.tsx` ya no genera su propio schema `FAQPage`. Las FAQs de láser (ES+EN), tatuajes (ES+EN) y piercing (ES+EN) se movieron al FAQPage global de `index.html`, que ahora contiene **36 preguntas** con propiedad `inLanguage` por respuesta. Google ve un único FAQPage por documento en todas las URLs.

### 2. `PIXEL_ID_PLACEHOLDER` sin reemplazar ✅ RESUELTO
Meta Pixel configurado con ID real `1221231726756946`. El pixel se inicializa en `analytics.ts` únicamente tras aceptar cookies (RGPD compliant). El noscript fallback en `index.html` y la variable `VITE_META_PIXEL_ID` en `.env.local` y Vercel están actualizados.

### 3. `calendarId: ""` en los 3 artistas ⚠️ PENDIENTE
`src/shared/config/artists.ts` — Los tres artistas tienen `calendarId: ""`. El modal de reserva paso 2 (`DateTimeStep`) usa este ID para fetchear disponibilidad de Google Calendar. Sin IDs reales el selector de fechas no puede mostrar slots disponibles. El sistema de reservas online está roto para los 3 artistas.

### 4. Emails de artistas no verificados ⚠️ PENDIENTE
`artists.ts` usa `pablo@lowkeytattoo.com`, `sergio@lowkeytattoo.com`, `fifo@lowkeytattoo.com`. La función `sendBookingRequest` envía confirmaciones a `artistEmail`. Si estos mailboxes no existen, los artistas nunca reciben notificaciones de reservas web. **Emails corporativos configurados** via ImprovMX — ver `EMAILS_CORPORATIVOS.md`. Pendiente actualizar las direcciones en `artists.ts`.

---

## WEB PÚBLICA

### Estado actual ✅
- Arquitectura SEO sólida: title/description/canonical/OG/Twitter/hreflang en todas las páginas vía `SEOHead`
- Schemas correctos: LocalBusiness + WebSite + FAQPage global (36 preguntas ES+EN), Service + BreadcrumbList por página de servicio, BlogPosting + BreadcrumbList en posts
- FAQPage global cubre tatuajes, láser y piercing — sin duplicados en páginas de servicio
- Estructura de URLs semántica: `/tatuajes-santa-cruz-tenerife`, `/piercing-tenerife`, `/laser-eliminacion-tatuajes-tenerife`, `/blog/[slug]`
- Cookie banner con Consent Mode v2 (RGPD compliant)
- Legal: `/politica-de-privacidad` y `/aviso-legal` presentes
- Footer: enlaces legales, links internos a todos los servicios
- Navbar: dropdown de servicios en desktop, acordeón en mobile, selector de idioma; enlace "Ubicación" eliminado (duplicaba "Estudio")
- Booking modal: 4 pasos (artista → fecha/hora → detalles → confirmación), animaciones, tracking GA4
- `og:image` específica en posts de blog (primera imagen del contenido, fallback al banner)
- Blog con paginación client-side (9 posts por página, botón "Más artículos")
- Formulario de contacto rápido en StudioInfo (nombre + email/teléfono + mensaje → `web_bookings`)
- Imágenes hero con `width`/`height` explícitos en LaserPage y PiercingPage (sin CLS)
- Galería con `loading="lazy"` en todas las imágenes individuales (Gallery.tsx)
- Sitemap: páginas de servicio y posts de blog en `changefreq: monthly`

### Gaps pendientes

**Inmediatos:**
- **TatuajesPage/PiercingPage sin FAQPage propio** — el FAQPage global cubre las preguntas más comunes, pero tener schemas Service-specific en cada página podría mejorar las rich results. Impacto bajo ya que el global ya funciona
- **TatuajesPage: imágenes de galería sin `width`/`height` explícitos** — puede causar CLS menor en la primera imagen

**A medio plazo:**
- **No hay sección de reseñas/testimonios** — elemento de confianza clave para conversiones
- **Sin `og:image` específica en páginas de servicio** — TatuajesPage, PiercingPage y LaserPage usan el banner genérico

---

## PANEL ADMIN

### Sessions ✅
Filtros por fecha/tipo/artista, resumen financiero, toggle de pago inline, formulario completo.

**Gaps resueltos:**
- ✅ **Delete session** — botón Trash2 visible en hover (solo owner)
- ✅ **`duration_minutes` en formulario** — campo con `step="15"`, columna "Dur." en tabla
- ✅ **Búsqueda por cliente** — filtra sesiones y totales financieros por nombre

### Clients ✅
Búsqueda, filtro por artista, cover photo thumbnail en lista, navegación a perfil.

**Gaps pendientes:**
- Sin **exportar clientes a CSV**
- Sin **campo birthday** visible en formulario (existe en DB y estado pero sin input)
- Sin **contador de sesiones** en la lista

### ClientProfile ✅
Fotos con conversión WebP automática (1920px max, 0.85 quality), signed URLs, lightbox, historial de sesiones, alergias.

**Gaps resueltos:**
- ✅ **Delete photo** — botón Trash2 en overlay hover; hook `useDeleteClientPhoto` en `useClients.ts`
- ✅ **Supabase query inline → hook** — `useClientPhotos` y `useDeleteClientPhoto` extraídos
- ✅ **Quick-edit de sesión** — Pencil en hover abre Dialog con precio, pagado y notas

**Gaps pendientes:**
- Sin **birthday field** en el formulario de edición
- Sin **navegación directa a sesión completa** desde el historial

### Finances ✅
KPIs con comparativa, gráfico de barras, impagados con recibo, CSV filtrado, tabs por artista.

**Gaps resueltos:**
- ✅ **Selector de periodo + comparativa** — 5 periodos, delta % en KPIs (verde/rojo)
- ✅ **Generación de recibo** — ventana de impresión con justificante completo
- ✅ **CSV respeta filtros** — exporta el periodo activo, nombre de fichero con rango de fechas

### Stock ✅
Grid de productos con barra de progreso, filtros por categoría, historial, create/delete para owner.

**Gaps pendientes:**
- **Sin "entrada" (restock)** — solo existe "registrar uso" (salida). Gap más crítico del módulo
- Sin **alerta activa** para productos en estado "Bajo" o "Agotado"
- Botón de delete usa `confirm()` nativo, inconsistente con el design system

### Artists
Gestión de perfiles con cards, edición de nombre/rol/artist_config_id.

**Gaps pendientes:**
- Sin **avatar upload** — `avatar_url` existe en el perfil pero no hay UI para cambiarlo
- Sin **invitación a nuevos artistas** — hay que crearlos directamente en Supabase Dashboard

### BlogAdmin ✅
Editor TipTap, validación de slug duplicado, contador de meta description, preview.

**Gaps pendientes:**
- Sin **gestión de tags** centralizada
- Sin **programación de publicación** (solo publicado/borrador)
- Imagen OG extraída automáticamente del contenido, no configurable desde el editor

### WebBookings ✅
Lista de reservas web, gestión de estado, conversión a sesión. Ahora solo muestra citas reales (excluye mensajes de contacto).

**Mejoras aplicadas (2026-04-11):**
- ✅ Badge numérico en sidebar (desktop + mobile + sheet "Más") con citas pendientes — refresco automático cada 60s
- ✅ Botón **WA** (verde) abre WhatsApp con mensaje pre-rellenado si el cliente tiene teléfono
- ✅ Botón **Email** abre `mailto:` con asunto y cuerpo pre-rellenados si el cliente tiene email
- ✅ El contador del badge se invalida al confirmar/cancelar una cita

**Gaps pendientes:**
- Sin **filtros** en la lista

### Mensajes ✅ NUEVO
Sección independiente en el admin (`/admin/messages`) para mensajes del formulario de contacto web.

- Badge numérico en sidebar con no leídos (refresco cada 60s)
- Botón "Responder" abre Gmail con destinatario y asunto pre-rellenados (solo si el contacto es email)
- Botón "Leído" por mensaje individual
- Notificación por email pendiente de configurar (EmailJS — ver `EMAILS_CORPORATIVOS.md`)

### Dashboard
KPIs (revenue, sesiones, clientes, pendientes), gráfico de ingresos, últimas 10 sesiones.

**Gaps pendientes:**
- Sin **widget de reservas web pendientes**
- Sin **selector de periodo** para los KPIs
- Sin **alertas de stock**

---

## SEO / ANALYTICS

### Estado actual ✅
- GA4 (G-TWXC2L3LQJ) con Consent Mode v2
- Meta Pixel (1221231726756946) con Consent Mode v2 — solo dispara tras aceptar cookies
- Search Console configurado y verificado
- Sitemap enviado con 8 URLs
- Indexación solicitada para las 4 URLs de servicio + 1 blog post
- FAQPage global (36 preguntas ES+EN) sin duplicados
- hreflang y canonical en todas las páginas
- `og:image` dinámica en posts de blog
- llms.txt presente

### Próximos pasos por prioridad

**Pendiente inmediato:**
- [ ] **Google Business Profile** — mayor impacto para búsquedas locales. Fotos, horario, categoría (Tattoo shop), enlace a web
- [ ] Actualizar emails de artistas en `artists.ts` con las nuevas direcciones corporativas

**Mes 1:**
- [ ] Crear 2 posts de blog nuevos (ver estrategia abajo)
- [ ] Añadir `width`/`height` a imágenes de galería en TatuajesPage

**Mes 2-3:**
- [ ] Solicitar primeras reseñas en Google
- [ ] Añadir `LocalBusiness` → `aggregateRating` cuando haya reseñas
- [ ] Linkbuilding: directorios de tatuaje de Canarias, menciones en Instagram

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
- Bundle admin lazy-loaded (React.lazy + Suspense) ✅
- Rutas web lazy-loaded (excepto Index) ✅
- Todas las imágenes de `src/assets/` convertidas a WebP (-912KB total) ✅
- `laser_lowkey.webp`: 869KB → 44KB (-95%) ✅
- `fetchPriority="high"` en imagen hero LCP ✅
- Google Fonts no bloqueantes (`media="print" onload`) ✅
- Preconnect a `fonts.googleapis.com`, `fonts.gstatic.com`, `maps.googleapis.com` ✅
- Gallery.tsx: `loading="lazy"` en todas las imágenes ✅
- Hero images con `width`/`height` explícitos en LaserPage y PiercingPage ✅
- WebP conversion en uploads de ClientProfile (1920px max, 0.85 quality) ✅
- Elfsight async script (no bloquea render) ✅

**Gaps pendientes:**
- Sin **Service Worker / PWA offline** — el manifest existe pero sin SW no hay caché offline
- Recharts se importa completo en Finances — candidato a lazy import

### Seguridad
- Signed URLs para fotos privadas de clientes (1h TTL) ✅
- Consent Mode v2 antes de inicializar analytics y pixel ✅
- No hay secretos hardcoded en el código fuente ✅

**Gaps pendientes:**
- Sin **rate limiting** en `web_bookings` insert — protección básica contra spam

### Deuda técnica
- `(s.client as any)` y `(s.artist as any)` en `Sessions.tsx`, `Finances.tsx` — relaciones sin tipar
- `format(new Date(s.date + "T00:00:00"), ...)` repetido en 3 ficheros sin helper compartido
- `birthday` en tipo `Client` y estado del form sin input en la UI

---

## RESUMEN DE PRIORIDADES

| Prioridad | Acción | Área | Estado |
|-----------|--------|------|--------|
| Prioridad | Acción | Área | Estado |
| 🔴 Crítico | **[A]** `useClients` ignora `artistId` — fuga de datos | Código / Seguridad | ✅ Resuelto |
| 🔴 Crítico | **[B]** Update de stock no atómico — race condition | Código / BD | ✅ Resuelto |
| 🔴 Crítico | Rellenar `calendarId` de los 3 artistas | Booking online | ⚠️ Pendiente |
| 🔴 Crítico | Actualizar emails artistas en `artists.ts` | Notificaciones | ⚠️ Pendiente |
| 🔴 Crítico | FAQPage duplicado en LaserPage | SEO | ✅ Resuelto |
| 🔴 Crítico | Meta Pixel configurado | Analytics | ✅ Resuelto |
| 🟠 Alto | **[C]** Signed URLs expiran en 1h sin staleTime | Admin / Fotos | ✅ Resuelto |
| 🟠 Alto | **[D]** `ProtectedRoute` no verifica `profile` | Seguridad | ✅ Resuelto |
| 🟠 Alto | **[E]** Race condition en `AdminAuthContext` | Código | ✅ Resuelto |
| 🟠 Alto | **[F]** `fetchProfile` sin manejo de errores | Código | ✅ Resuelto |
| 🟠 Alto | Google Business Profile | SEO local | ⚠️ Pendiente |
| 🟠 Alto | Añadir "entrada" (restock) en Stock | Admin | ⚠️ Pendiente |
| 🟠 Alto | Notificaciones email formulario contacto (EmailJS) | Admin UX | ⚠️ Pendiente |
| 🟡 Medio | **[G]** Sin feedback de error en mutaciones admin | UX / Código | ✅ Resuelto |
| 🟡 Medio | **[H]** `useFinancesOverview` carga todo el historial | Performance | ✅ Resuelto |
| 🟡 Medio | **[I]** `trackCtaClick` ignora consentimiento en fbq | RGPD | ✅ Resuelto |
| 🟡 Medio | **[J]** Casts `as any` en joins de Supabase | Código | ✅ Resuelto |
| 🟡 Medio | Delete session | Admin Sessions | ✅ Resuelto |
| 🟡 Medio | Delete photo en ClientProfile | Admin | ✅ Resuelto |
| 🟡 Medio | Duration + búsqueda en Sessions | Admin | ✅ Resuelto |
| 🟡 Medio | Comparativa + recibo + CSV filtrado en Finances | Admin | ✅ Resuelto |
| 🟡 Medio | Formulario de contacto + sección Mensajes en admin | Web / Admin | ✅ Resuelto |
| 🟡 Medio | Paginación del blog | Web pública | ✅ Resuelto |
| 🟡 Medio | `og:image` específica por post | Social SEO | ✅ Resuelto |
| 🟡 Medio | Performance web (WebP, fonts, lazy routes, LCP) | Técnico | ✅ Resuelto |
| 🟡 Medio | 2 nuevos posts de blog | SEO / contenido | ⚠️ Pendiente |
| 🟡 Medio | Campo birthday en Clients / ClientProfile | Admin | ⚠️ Pendiente |
| 🟢 Bajo | **[K]** `blog_posts` falta en tipo `Database` | Código | ✅ Resuelto |
| 🟢 Bajo | **[L]** `confirm()` nativo → `AlertDialog` en Stock | UX | ✅ Resuelto |
| 🟢 Bajo | **[M]** Sin paginación en lista de clientes | Performance | ✅ Resuelto |
| 🟢 Bajo | Primer lote de reseñas Google | Credibilidad | ⚠️ Pendiente |
| 🟢 Bajo | Tipar relaciones `session.client` / `session.artist` | Código | ✅ Resuelto |
| 🟢 Bajo | Helper compartido para format de fechas | Código | ⚠️ Pendiente |
