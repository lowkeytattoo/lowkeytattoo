# REVISIÓN EXHAUSTIVA — LOWKEY TATTOO
> Generado: 2026-04-07 · Última actualización: 2026-04-07

---

## BUGS CRÍTICOS

### 1. FAQPage duplicado en LaserPage ✅ RESUELTO
`LaserPage.tsx` ya no genera su propio schema `FAQPage`. Las FAQs de láser (ES+EN), tatuajes (ES+EN) y piercing (ES+EN) se movieron al FAQPage global de `index.html`, que ahora contiene **36 preguntas** con propiedad `inLanguage` por respuesta. Google ve un único FAQPage por documento en todas las URLs.

### 2. `PIXEL_ID_PLACEHOLDER` sin reemplazar ⚠️ PENDIENTE
`index.html:495` — el `<noscript>` del Meta Pixel todavía contiene `PIXEL_ID_PLACEHOLDER`. No afecta el tracking activo (que va por `analytics.ts`), pero debe reemplazarse con el ID real o eliminarse una vez configurado Meta Pixel.

### 3. `calendarId: ""` en los 3 artistas ⚠️ PENDIENTE
`src/shared/config/artists.ts` — Los tres artistas tienen `calendarId: ""`. El modal de reserva paso 2 (`DateTimeStep`) usa este ID para fetchear disponibilidad de Google Calendar. Sin IDs reales el selector de fechas no puede mostrar slots disponibles. El sistema de reservas online está roto para los 3 artistas.

### 4. Emails de artistas no verificados ⚠️ PENDIENTE
`artists.ts` usa `pablo@lowkeytattoo.com`, `sergio@lowkeytattoo.com`, `fifo@lowkeytattoo.com`. La función `sendBookingRequest` envía confirmaciones a `artistEmail`. Si estos mailboxes no existen, los artistas nunca reciben notificaciones de reservas web.

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
- Navbar: dropdown de servicios en desktop, acordeón en mobile, selector de idioma
- Booking modal: 4 pasos (artista → fecha/hora → detalles → confirmación), animaciones, tracking GA4
- `og:image` específica en posts de blog (primera imagen del contenido, fallback al banner)
- Blog con paginación client-side (9 posts por página, botón "Más artículos")
- Formulario de contacto rápido en StudioInfo (nombre + email/teléfono + mensaje → `web_bookings`)
- Imágenes hero con `width`/`height` explícitos en LaserPage y PiercingPage (sin CLS)
- Galería con `loading="lazy"` en todas las imágenes individuales (Gallery.tsx)
- Sitemap: páginas de servicio y posts de blog en `changefreq: monthly`

### Gaps pendientes

**Inmediatos:**
- **TatuajesPage/PiercingPage sin FAQPage propio** — el FAQPage global cubre las preguntas más comunes, pero tener schemas Service-specific en cada página podría mejorar las rich results cuando Google cachea la URL individual. Impacto bajo ya que el global ya funciona
- ~~`/blog` (índice) con `changefreq: weekly`~~ — verificado: `/blog` ya está en `monthly` (sitemap.xml:64). La única URL en `weekly` es la home (`/`), lo cual es correcto
- **TatuajesPage: imágenes de galería sin `width`/`height` explícitos** — usa `loading={i===0 ? "eager" : "lazy"}` pero sin dimensiones declaradas, puede causar CLS menor en la primera imagen

**A medio plazo:**
- **No hay sección de reseñas/testimonios** — elemento de confianza clave para conversiones. Se puede usar Google Reviews embebido o un bloque manual
- **Sin `og:image` específica en páginas de servicio** — TatuajesPage, PiercingPage y LaserPage siguen usando el banner genérico

---

## PANEL ADMIN

### Sessions ✅
Filtros por fecha/tipo/artista, resumen financiero, toggle de pago inline, formulario completo.

**Gaps resueltos:**
- ✅ **Delete session** — botón Trash2 visible en hover (solo owner), con confirmación inline
- ✅ **`duration_minutes` en formulario** — campo numérico con `step="15"` en grid de 3 columnas (zona / estilo / duración); columna "Dur." visible en tabla
- ✅ **Búsqueda por cliente** — input con icono Search filtra `filteredSessions` por nombre de cliente; los totales financieros de cabecera respetan el filtro

### Clients ✅
Búsqueda, filtro por artista, cover photo thumbnail en lista, navegación a perfil.

**Gaps pendientes:**
- Sin **exportar clientes a CSV** — Finances sí tiene export pero Clients no
- Sin **campo birthday** visible en formulario de creación/edición (el campo `birthday: null` existe en el estado del form pero no se renderiza ningún input para él)
- Sin **contador de sesiones** en la lista — no se ve a golpe de vista cuántas sesiones tiene cada cliente

### ClientProfile ✅
Fotos con conversión WebP automática (1920px max, 0.85 quality), signed URLs, lightbox, historial de sesiones, alergias.

**Gaps resueltos:**
- ✅ **Delete photo** — botón Trash2 en overlay hover de cada foto; usa `useDeleteClientPhoto` hook (elimina de storage y DB, invalida queries)
- ✅ **Supabase query inline → hook** — `useClientPhotos(clientId)` y `useDeleteClientPhoto()` extraídos a `src/admin/hooks/useClients.ts`, consistente con el resto del codebase
- ✅ **Quick-edit de sesión desde historial** — icono Pencil en hover abre Dialog con precio, estado pagado (Checkbox) y notas; usa `useUpdateSession`

**Gaps pendientes:**
- Sin **birthday field** en el formulario de edición de cliente (el campo existe en DB y tipos pero no hay input en la UI)
- Sin **navegación directa a Sessions** desde el historial — el quick-edit permite editar precio/pago/notas, pero para ver la sesión completa o cambiar tipo/fecha hay que ir a Sessions manualmente

### Finances ✅
KPIs con comparativa de periodo anterior, gráfico de barras apilado, listado de impagados con botón de recibo, CSV respetando filtros, tabs por artista para owner.

**Gaps resueltos:**
- ✅ **Selector de periodo + comparativa** — botones "Este mes / Mes anterior / 3 meses / Este año / Todo"; KPIs muestran delta `+X%` / `-X%` (verde/rojo) respecto al periodo equivalente anterior; segunda llamada `useSessions` con `enabled: activePeriod !== "all"`
- ✅ **Generación de recibo** — `printSessionReceipt()` abre ventana de impresión con justificante formateado (fecha, cliente, artista, servicio, zona, depósito, total, dirección del estudio); botón Printer visible en hover en filas de impagados
- ✅ **CSV respeta filtros** — `useSessions` acepta `enabled` en `SessionFilters`; el export usa el array filtrado por periodo activo y nombra el fichero con el rango de fechas (`finanzas_YYYY-MM-DD_YYYY-MM-DD.csv`)

### Stock ✅
Grid de productos con barra de progreso, filtros por categoría, historial de movimientos, create/delete para owner.

**Gaps pendientes:**
- **Sin "entrada" (restock)** — solo existe "registrar uso" (salida). El owner no puede añadir stock desde la UI. Gap más crítico de este módulo
- Sin **alerta activa** para productos en estado "Bajo" o "Agotado" — hay badges visuales pero no notificaciones ni resumen en Dashboard
- El botón de delete usa `confirm()` nativo del browser, inconsistente con el design system

### Artists
Gestión de perfiles con cards, edición de nombre/rol/artist_config_id.

**Gaps pendientes:**
- Sin **avatar upload** — el campo `avatar_url` existe en el perfil pero no hay forma de cambiarlo desde el admin
- Sin **invitación a nuevos artistas** — para añadir un nuevo miembro hay que crear el usuario directamente en Supabase Dashboard

### BlogAdmin ✅
Editor TipTap con placeholder, validación de slug duplicado, contador de meta description, preview.

**Gaps pendientes:**
- Sin **gestión de tags** centralizada — tags como texto libre sin consistencia entre posts
- Sin **programación de publicación** — solo existe publicado/borrador, no fecha futura de publicación automática
- Sin **imagen OG específica por post desde admin** — el campo no existe en el editor; la imagen OG del post se extrae automáticamente del primer `<img>` del contenido (solución actual funcional pero no explícita)

### WebBookings ✅
Lista de reservas web, gestión de estado, conversión a sesión con auto-creación de cliente.

**Gaps pendientes:**
- Sin **notificación en tiempo real** — cuando llega una reserva nueva el equipo no recibe aviso (ni email, ni badge en sidebar). Hay que entrar al admin a revisar manualmente
- Sin **filtros** en la lista de reservas
- El sidebar del admin no muestra badge de "reservas pendientes"

### Dashboard
KPIs (revenue, sesiones, clientes, pendientes), gráfico de ingresos, últimas 10 sesiones.

**Gaps pendientes:**
- Sin **widget de reservas web pendientes** — una de las métricas más importantes del día a día no está visible en la pantalla principal
- Sin **selector de periodo** para los KPIs (totales de siempre, no del mes en curso)
- Sin **alertas de stock** — productos en rojo/amarillo no aparecen en el dashboard

---

## SEO / ANALYTICS

### Estado actual ✅
- GA4 (G-TWXC2L3LQJ) funcionando con Consent Mode v2
- Search Console configurado, DNS verification pendiente (hasta 5 días tras alta)
- Sitemap enviado con 8 URLs; posts de blog y páginas de servicio en `monthly`
- Indexación solicitada para las 4 URLs principales
- FAQPage global (36 preguntas ES+EN) sin duplicados — verificado post-fix
- hreflang en todas las páginas
- Canonical en todas las páginas
- `og:image` dinámica en posts de blog (primera imagen del contenido)
- llls.txt presente

### Próximos pasos por prioridad

**Pendiente inmediato:**
- [ ] Confirmar verificación DNS en Search Console
- [ ] Reemplazar `PIXEL_ID_PLACEHOLDER` en `index.html:495` con ID real (o eliminar hasta tener Meta Pixel configurado)
- [ ] Cambiar `changefreq` de `/blog` (índice) de `weekly` a `monthly` en `public/sitemap.xml:10`

**Mes 1 (alto impacto):**
- [ ] **Google Business Profile** — impacto más grande para búsquedas locales. Fotos de alta calidad, horario, categoría (Tattoo shop), enlace a web, activar mensajes
- [ ] Crear 2 posts de blog nuevos (ver estrategia de contenido abajo)
- [ ] Añadir `width`/`height` a las imágenes de galería en TatuajesPage (CLS menor)

**Mes 2-3:**
- [ ] Solicitar primeras reseñas en Google (pedirlo en persona al terminar cada sesión)
- [ ] Añadir `LocalBusiness` → `aggregateRating` al schema cuando haya reseñas
- [ ] Linkbuilding: directorios de estudios de tatuaje de Canarias, menciones en Instagram de clientes

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
- Gallery.tsx: todas las imágenes con `loading="lazy"` ✅
- Hero images de LaserPage y PiercingPage con `width`/`height` explícitos (CLS eliminado) ✅

**Gaps pendientes:**
- Sin **image optimization** para assets de `src/assets/` (gallery-1...4.jpg, laser_lowkey.jpg) — si son imágenes grandes sin comprimir impactan el LCP
- Sin **Service Worker / PWA offline** — el manifest existe pero sin SW no hay caché offline
- Recharts se importa completo en Finances — se podría hacer lazy para reducir bundle del admin

### Seguridad
- Signed URLs para fotos privadas de clientes (1h TTL) ✅
- Consent Mode v2 antes de inicializar analytics ✅
- No hay secretos hardcoded en el código fuente ✅

**Gaps pendientes:**
- Sin **rate limiting** en el endpoint de booking — `sendBookingRequest` / `web_bookings` insert debería tener protección contra spam
- El botón de delete en Stock usa `confirm()` — riesgo XSS teórico bajo con datos de Supabase, pero inconsistente con el design system

### Deuda técnica
- `(s.client as any)` y `(s.artist as any)` repetidos en `Sessions.tsx`, `Finances.tsx` — el tipo `Session` debería tener las relaciones tipadas
- `format(new Date(s.date + "T00:00:00"), ...)` — el fix de timezone está repetido en `Sessions.tsx`, `ClientProfile.tsx` y `Finances.tsx` sin helper compartido
- `handleCreateSession` en ClientProfile no tiene manejo de error visible para el usuario
- `birthday` existe en el tipo `Client` y en el estado del form de `Clients.tsx` pero no hay input para él en la UI — o se añade o se elimina del tipo

---

## RESUMEN DE PRIORIDADES

| Prioridad | Acción | Área | Estado |
|-----------|--------|------|--------|
| 🔴 Crítico | Rellenar `calendarId` de los 3 artistas | Booking online | ⚠️ Pendiente |
| 🔴 Crítico | Verificar emails de artistas | Notificaciones | ⚠️ Pendiente |
| 🔴 Crítico | FAQPage duplicado en LaserPage | SEO | ✅ Resuelto |
| 🟠 Alto | Añadir "entrada" (restock) en Stock | Admin | ⚠️ Pendiente |
| 🟠 Alto | Google Business Profile | SEO local | ⚠️ Pendiente |
| 🟠 Alto | Reemplazar `PIXEL_ID_PLACEHOLDER` | Analytics | ⚠️ Pendiente |
| 🟠 Alto | Badge "reservas pendientes" en sidebar/dashboard | Admin UX | ⚠️ Pendiente |
| 🟡 Medio | Delete session | Admin Sessions | ✅ Resuelto |
| 🟡 Medio | Delete photo en ClientProfile | Admin | ✅ Resuelto |
| 🟡 Medio | Duration + búsqueda en Sessions | Admin | ✅ Resuelto |
| 🟡 Medio | Comparativa + recibo + CSV filtrado en Finances | Admin | ✅ Resuelto |
| 🟡 Medio | Formulario de contacto rápido | Web pública | ✅ Resuelto |
| 🟡 Medio | Paginación del blog | Web pública | ✅ Resuelto |
| 🟡 Medio | `og:image` específica por post | Social SEO | ✅ Resuelto |
| 🟡 Medio | 2 nuevos posts de blog | SEO / contenido | ⚠️ Pendiente |
| 🟡 Medio | Campo birthday en Clients / ClientProfile | Admin | ⚠️ Pendiente |
| 🟢 Bajo | Primer lote de reseñas Google | Credibilidad | ⚠️ Pendiente |
| 🟢 Bajo | Tipar relaciones `session.client` / `session.artist` | Código | ⚠️ Pendiente |
| 🟢 Bajo | Helper compartido para format de fechas | Código | ⚠️ Pendiente |
| 🟢 Bajo | `changefreq` monthly para índice del blog | Sitemap | ✅ Ya estaba correcto |
