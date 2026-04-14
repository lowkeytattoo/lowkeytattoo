# REVISIÓN EXHAUSTIVA — LOWKEY TATTOO
> Generado: 2026-04-07 · Última actualización: 2026-04-14 (rev. 2)

---

## REVISIÓN CÓDIGO — 2026-04-14 (revisión 2, post-implementación)

Segunda revisión exhaustiva tras implementar los 5 bugs del plan anterior. Alcance: todos los hooks, contextos, páginas admin, componentes web y configuración.

---

### 🟠 ALTOS

#### A. Booking form: `calendarId` de artistas arquitectónicamente desconectado de Supabase
**Archivo:** `src/web/components/booking/DateTimeStep.tsx` · Línea 26 / `src/shared/config/artists.ts` · Líneas 19, 28, 36

`DateTimeStep` recibe un objeto `Artist` del config estático `ARTISTS`. Los tres artistas tienen `calendarId: ""`. El hook `useArtistBusyDays(artist.calendarId || null)` recibe `null` → `enabled: false` → no se fetcha disponibilidad → todos los días aparecen disponibles en el formulario de reservas.

El problema de fondo es arquitectónico: los `calendar_id` reales se guardan en la tabla `profiles` de Supabase (gestionables desde Admin → Artistas), pero el flujo de reservas web usa el config estático que nunca se actualiza. Aunque los artistas configuren sus calendarios en el panel, el formulario web no los leerá.

**Fix:** El componente padre del flujo de reserva (`BookingModal` o equivalente) debe pasar el `calendarId` real desde un fetch de Supabase en lugar de usar `artist.calendarId` del config estático. Alternativa más sencilla: añadir un campo `calendarId` al config estático y mantenerlo sincronizado con `profiles.calendar_id` cuando se configuren.

> **Nota:** Este bug ya estaba parcialmente documentado como "histórico #3" (calendarId vacío), pero la causa raíz —que Supabase y el config estático son fuentes de verdad distintas— no estaba identificada.

---

### 🟡 MEDIOS

#### B. `RoleGuard` retorna `null` durante la carga de auth — flash de pantalla en blanco
**Archivo:** `src/admin/components/RoleGuard.tsx` · Línea 13

`if (loading) return null` hace que la ruta `/admin/artists` renderice en blanco mientras el contexto de auth está cargando. `ProtectedRoute` ya tiene un spinner de carga, pero `RoleGuard` no.

**Fix:**
```tsx
if (loading) return (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);
```

#### C. `AdminSidebar`: `MOBILE_ITEMS` hardcodea `/admin/calendar` aunque puede estar filtrado
**Archivo:** `src/admin/components/AdminSidebar.tsx` · Líneas 38, 56–59

`MOBILE_ITEMS` contiene `/admin/calendar` fijo, pero `allItems` filtra ese enlace si el perfil no tiene `calendar_id`. El resultado es que `mobileItems` intenta mapear una ruta que no está en `allItems`, devuelve `undefined` y la barra móvil queda con 4 items en lugar de 5.

**Fix:** Derivar los items móviles de `allItems` en lugar de hardcodear rutas.

---

### 🟢 BAJOS

#### D. `allNavItems` en `AdminSidebar` sin interfaz de tipo explícita
**Archivo:** `src/admin/components/AdminSidebar.tsx` · Línea 24

El array se infiere con propiedades opcionales heterogéneas. Sin una interfaz `NavItem` declarada, TypeScript no alerta si se añade un item con una propiedad desconocida.

#### E. `Calendar.tsx`: `dateStr` puede desincronizarse de `form.date` entre renders
**Archivo:** `src/admin/pages/Calendar.tsx` · Líneas dentro de `NewEventDialog`

`dateStr` se recalcula en cada render a partir de `defaultDate`. Si el usuario selecciona otro día sin cerrar el modal, `dateStr` cambia pero `form.date` mantiene el valor anterior. El `DatePickerInput` usa `form.date || dateStr` como fallback, lo que puede mostrar una fecha inconsistente.

#### F. `Sessions.tsx`: `as any` en relaciones de Supabase — deuda técnica pendiente
**Archivo:** `src/admin/pages/Sessions.tsx` · Líneas 121, 365, 368, 369, 412, 441

`(s.client as any)?.name` y `(s.artist as any)?.display_name`. Ya resuelto en `Clients.tsx` y `Dashboard.tsx`, pendiente en `Sessions.tsx`. No provoca crashes pero oculta errores de tipado.

---

### ✅ VALIDACIONES — SIN BUG (revisión 2)

- **Sessions endTime calculation:** `new Date(0, 0, 0, h, m + durationMins)` — JavaScript maneja el desbordamiento de minutos correctamente. `getHours()` y `getMinutes()` devuelven los valores envueltos. No es un bug.
- **`useFinancesOverview` totalClients sin filtro de artista:** el campo `totalClients` solo se muestra en la tarjeta `{isOwner && ...}`. El owner debe ver todos los clientes, por lo que no filtrar por artista es el comportamiento correcto.
- **WebBookings Bug 1 verificado:** `profiles` ya estaba cargado en `WebBookings.tsx`; la derivación de `artistProfile?.calendar_id` y su paso al evento es correcta.
- **Dashboard Bug 2 verificado:** `useArtistProfiles` eliminado, `profile?.calendar_id` usado directamente. El widget ahora aparece para cualquier usuario con `calendar_id` (no solo owner), que es el comportamiento deseado.
- **Calendar Bug 3 verificado:** early return con mensaje se coloca *después* de todos los hooks (cumple Rules of Hooks).
- **Calendar Bug 4 verificado:** `useEffect` resetea `invitedIds` y `form` cuando `open` cambia a `false`.
- **WebBookings Bug 5 verificado:** filtro server-side `.eq("artist_config_id", ...)` añadido correctamente.

---

### TABLA RESUMEN — REVISIÓN 2 (2026-04-14)

| Severidad | ID | Descripción | Estado |
|-----------|-----|-------------|--------|
| 🟠 Alto | A | Booking form: calendarId desconectado de perfiles Supabase | ⚠️ Pendiente |
| 🟡 Medio | B | RoleGuard: flash en blanco durante carga en `/admin/artists` | ⚠️ Pendiente |
| 🟡 Medio | C | AdminSidebar: items móviles hardcodeados pueden quedar incompletos | ⚠️ Pendiente |
| 🟢 Bajo | D | AdminSidebar: `NavItem` sin interfaz de tipo | ⚠️ Pendiente |
| 🟢 Bajo | E | Calendar dialog: `dateStr` puede desincronizarse | ⚠️ Pendiente |
| 🟢 Bajo | F | Sessions.tsx: `as any` en relaciones — deuda técnica | ⚠️ Pendiente |

---

## REVISIÓN CÓDIGO — 2026-04-14 (revisión 1)

Revisión exhaustiva tras los cambios de la sesión: reorganización del sidebar, calendario individual por artista, invitaciones de Google Calendar desde Calendario y Sesiones, y actualización de documentación.

---

### 🔴 CRÍTICOS

#### 1. `WebBookings`: `useCreateCalendarEvent` sin `calendarId` — eventos van al calendario por defecto
**Archivo:** `src/admin/pages/WebBookings.tsx` · Líneas 221, 287

`const createCalendarEvent = useCreateCalendarEvent()` se inicializa sin `calendarId`. Cuando se confirma una cita y se llama a `createCalendarEvent.mutateAsync(event)`, el objeto `event` viene de `buildBookingEvent()` que no incluye `calendarId`. El hook cae al `GOOGLE_CALENDAR_ID` de entorno (calendario de dev/pruebas) en lugar del calendario real del artista asignado. Las citas web confirmadas nunca llegan al calendario del artista correcto.

**Fix:** Obtener el `calendar_id` del perfil del artista asignado y pasarlo al hook o al evento antes de llamar a `mutateAsync`. ✅ **RESUELTO**

---

### 🟠 ALTOS

#### 2. `Dashboard`: widget de calendario usa `firstCalendarProfile` en lugar del usuario logueado
**Archivo:** `src/admin/pages/Dashboard.tsx` · Líneas 45, 49–52

El widget de calendario del dashboard busca el primer perfil con `calendar_id` (`profiles.find(p => !!p.calendar_id)`) en lugar de usar `profile?.calendar_id` del usuario logueado. El owner ve los eventos del primer artista (por orden de query), no los suyos ni un resumen global.

**Fix:** Usar `profile?.calendar_id` directamente para `useCalendarEvents`. ✅ **RESUELTO**

---

### 🟡 MEDIOS

#### 3. `AdminSidebar`: `MOBILE_ITEMS` hardcodea `/admin/calendar` aunque puede estar filtrado
**Archivo:** `src/admin/components/AdminSidebar.tsx` · Líneas 38, 56–59

`MOBILE_ITEMS` contiene `/admin/calendar` fijo, pero `allItems` filtra ese enlace si `profile?.calendar_id` es nulo (`requiresCalendar: true`). En ese caso, `mobileItems` intenta mapear una ruta que no existe en `allItems` y devuelve `undefined`, que se filtra — dejando la barra móvil con 4 items en lugar de 5 y un gap visual.

**Fix:** Recalcular `MOBILE_ITEMS` dinámicamente a partir de `allItems` o garantizar que el fallback en mobile siempre tenga 5 items independientemente del calendario.

#### 4. `WebBookings`: filtrado de artista solo client-side, no en la query de Supabase
**Archivo:** `src/admin/pages/WebBookings.tsx` · Líneas 181–193

La query trae todas las `web_bookings` sin filtrar por `artist_config_id`. El filtrado se aplica solo al renderizar. Aunque RLS lo protege a nivel de base de datos, un artista con la anon key podría interceptar la respuesta de red y ver citas de otros artistas.

**Fix:** Añadir `.eq("artist_config_id", profile.artist_config_id)` en la query cuando `!isOwner`. ✅ **RESUELTO**

#### 5. `Calendar.tsx`: `invitedIds` no se resetea al cancelar el diálogo
**Archivo:** `src/admin/pages/Calendar.tsx` · Líneas 120–169

`invitedIds` se resetea en `handleSubmit` exitoso pero no en `onClose`. Si el usuario selecciona artistas y cancela sin guardar, la próxima vez que abra el diálogo verá los mismos artistas ya seleccionados.

**Fix:** Llamar a `setInvitedIds([])` dentro de `onClose`. ✅ **RESUELTO**

#### 6. `Calendar.tsx`: el formulario `form` no se resetea al cancelar el diálogo
**Archivo:** `src/admin/pages/Calendar.tsx` · Líneas 106–114

El estado `form` (summary, date, startTime, endTime, description, allDay) no se reinicia al cerrar el diálogo sin guardar. Al reabrirlo, el usuario ve los datos de la sesión anterior.

**Fix:** Resetear `form` en `onClose` o en `onOpenChange` cuando `open` cambia a `false`. ✅ **RESUELTO**

#### 7. `/admin/calendar` accesible directamente sin `calendar_id` — renderiza en estado vacío
**Archivo:** `src/App.tsx` · Línea 133

La ruta `/admin/calendar` no tiene `RoleGuard` ni ninguna otra protección. Si un artista sin `calendar_id` navega directamente a esa URL (no aparece en el sidebar, pero la URL es pública dentro del panel), el componente se renderiza con `calendarId = null`, `useCalendarEvents` no ejecuta la query y la página queda en blanco sin mensaje explicativo.

**Fix:** Añadir un guard en `CalendarPage` que muestre un mensaje "No tienes un calendario configurado" cuando `calendarId` es nulo, en lugar de pantalla vacía. ✅ **RESUELTO**

---

### 🟢 BAJOS

#### 8. `allNavItems` en `AdminSidebar` sin tipo explícito
**Archivo:** `src/admin/components/AdminSidebar.tsx` · Línea 24

El array `allNavItems` se infiere con propiedades opcionales heterogéneas (`ownerOnly?`, `requiresCalendar?`, `badge?`, `messagesBadge?`, `bookingsBadge?`). Sin una interfaz `NavItem` explícita, añadir un item nuevo con una propiedad desconocida no genera error de TypeScript.

#### 9. `Calendar.tsx`: `dateStr` calculado en cada render pero puede desincronizarse con `form.date`
**Archivo:** `src/admin/pages/Calendar.tsx` · Líneas 122–123, 190

`dateStr` se recalcula cada render a partir de `defaultDate`. Si `defaultDate` cambia entre renders (usuario selecciona otro día sin cerrar el modal), `dateStr` se actualiza pero `form.date` puede estar desfasado. El fallback `form.date || dateStr` en el `DatePickerInput` podría mostrar una fecha inconsistente.

#### 10. `Sessions.tsx`: `as any` persistente en relaciones de Supabase
**Archivo:** `src/admin/pages/Sessions.tsx` · Líneas 121, 365, 368, 369, 412, 441

`(s.client as any)?.name` y `(s.artist as any)?.display_name` siguen presentes. Ya resuelto en `Clients.tsx` y `Dashboard.tsx` en la revisión anterior, pero `Sessions.tsx` aún no usa `SessionWithRelations`.

#### 11. `Sessions.tsx`: `toast` de `sonner` importado dos veces (nativo + nuevo import)
**Archivo:** `src/admin/pages/Sessions.tsx` · Líneas 1–40

En la sesión de hoy se añadió `import { toast } from "sonner"` al archivo. Verificar que no existía ya una importación previa del mismo paquete en otro lugar del archivo para evitar duplicado silencioso. ✅ **VERIFICADO — sin duplicado**

---

### ✅ VALIDACIONES — SIN BUG (revisión 1)

- **Sessions invite `calendarId`:** aunque `useCreateCalendarEvent()` se llama sin parámetro de hook, el `calendarId` se pasa correctamente en el objeto de evento (`{ calendarId: artistProfile.calendar_id, ... }`). El hook actualizado extrae `event.calendarId` con prioridad, por lo que funciona correctamente.
- **Traducciones ES/EN:** todas las claves están balanceadas en ambos idiomas. Sin claves huérfanas.
- **Import de `sonner`:** `Toaster` está renderizado en `App.tsx`. Los `toast.success/error` funcionarán correctamente.
- **Sessions invite guard:** si `artistProfile` es `undefined` o no tiene `calendar_id`/email, la opción de invitación no se muestra — el código es defensivo.
- **`useSessionForm.reset()`:** cubre todos los campos del formulario sin omisiones.

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

### 3. `calendarId: ""` en los 3 artistas + desconexión arquitectónica ⚠️ PENDIENTE
`src/shared/config/artists.ts` — Los tres artistas tienen `calendarId: ""`. El modal de reserva paso 2 (`DateTimeStep`) usa este campo para fetchear disponibilidad de Google Calendar. Sin IDs reales el selector de fechas no puede mostrar slots disponibles. El sistema de reservas online no comprueba disponibilidad para ningún artista.

**Problema adicional identificado en Rev2:** incluso cuando los artistas configuren su `calendar_id` en Supabase (Admin → Artistas), el formulario de reservas web no lo leerá porque usa el config estático. Hay que mantener `calendarId` en `artists.ts` sincronizado con `profiles.calendar_id`, o bien rediseñar el flujo para que `DateTimeStep` reciba el ID desde Supabase.

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
| 🔴 Crítico | **[Rev1-1]** WebBookings: eventos al calendario de dev en vez del artista | Código | ✅ Resuelto |
| 🔴 Crítico | FAQPage duplicado en LaserPage | SEO | ✅ Resuelto |
| 🔴 Crítico | Meta Pixel configurado | Analytics | ✅ Resuelto |
| 🟠 Alto | **[Rev2-A]** Booking form: calendarId desconectado de Supabase profiles | Booking / Arquitectura | ⚠️ Pendiente |
| 🟠 Alto | **[Rev1-2]** Dashboard: widget calendario mostraba artista incorrecto | Código | ✅ Resuelto |
| 🟠 Alto | **[C]** Signed URLs expiran en 1h sin staleTime | Admin / Fotos | ✅ Resuelto |
| 🟠 Alto | **[D]** `ProtectedRoute` no verifica `profile` | Seguridad | ✅ Resuelto |
| 🟠 Alto | **[E]** Race condition en `AdminAuthContext` | Código | ✅ Resuelto |
| 🟠 Alto | **[F]** `fetchProfile` sin manejo de errores | Código | ✅ Resuelto |
| 🟠 Alto | Google Business Profile | SEO local | ⚠️ Pendiente |
| 🟠 Alto | Rellenar `calendarId` de los 3 artistas (Supabase + config) | Booking online | ⚠️ Pendiente |
| 🟠 Alto | Actualizar emails artistas en `artists.ts` con emails corporativos | Notificaciones | ⚠️ Pendiente |
| 🟠 Alto | Añadir "entrada" (restock) en Stock | Admin | ⚠️ Pendiente |
| 🟠 Alto | Notificaciones email formulario contacto (EmailJS) | Admin UX | ⚠️ Pendiente |
| 🟡 Medio | **[Rev2-B]** RoleGuard: flash en blanco durante carga en `/admin/artists` | UX | ⚠️ Pendiente |
| 🟡 Medio | **[Rev2-C]** AdminSidebar: items móviles pueden quedar incompletos | UX | ⚠️ Pendiente |
| 🟡 Medio | **[Rev1-4]** WebBookings: filtro server-side por artista | Seguridad / Código | ✅ Resuelto |
| 🟡 Medio | **[Rev1-5/6]** Calendar dialog: estado no se reseteaba al cancelar | UX / Código | ✅ Resuelto |
| 🟡 Medio | **[Rev1-7]** `/admin/calendar` sin mensaje de estado vacío | UX | ✅ Resuelto |
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
| 🟢 Bajo | **[Rev2-D/E/F]** NavItem sin tipo · dateStr desync · `as any` Sessions | Código | ⚠️ Pendiente |
| 🟢 Bajo | **[K]** `blog_posts` falta en tipo `Database` | Código | ✅ Resuelto |
| 🟢 Bajo | **[L]** `confirm()` nativo → `AlertDialog` en Stock | UX | ✅ Resuelto |
| 🟢 Bajo | **[M]** Sin paginación en lista de clientes | Performance | ✅ Resuelto |
| 🟢 Bajo | Primer lote de reseñas Google | Credibilidad | ⚠️ Pendiente |
| 🟢 Bajo | Tipar relaciones `session.client` / `session.artist` | Código | ✅ Resuelto |
| 🟢 Bajo | Helper compartido para format de fechas | Código | ⚠️ Pendiente |
