# Lowkey Tattoo — Estado del Proyecto
*Última actualización: 16 abril 2026*

---

## Resumen rápido

| Área | Estado |
|------|--------|
| Panel Admin — funcionalidad | ✅ Completo |
| Panel Admin — calidad de código | ✅ Completo |
| Web pública — SEO técnico | ✅ Completo |
| Web pública — og:image páginas de servicio | ✅ Completo |
| Analytics / Consent Mode v2 | ✅ Completo |
| Emails de contacto | ✅ Completo |
| Google Reviews (5 reseñas) | ✅ Conseguido |
| Calendar IDs artistas | ⚠️ Parcial — pendiente rellenar en Supabase |
| Stock — entradas / restock | 🅿️ Aparcado |
| Blog — nuevos posts | 🅿️ Aparcado |

---

## Panel de Administración

### Seguridad y acceso
- **RoleGuard** muestra spinner mientras carga el rol, eliminando el flash de pantalla en blanco al navegar como propietario/artista.
- **RLS de Supabase**: bucket `avatars` creado como público con políticas de INSERT/UPDATE/SELECT para usuarios autenticados. Uploads de avatar funcionan sin errores.

### Dashboard
- Selector de período **Semana / Mes / Trimestre** — los KPIs (ingresos, sesiones, media por sesión) se recalculan dinámicamente según el rango elegido.
- Widget de **reservas pendientes** con contador en tiempo real (refresco cada 60 s), enlaza directamente a `/admin/bookings`.

### Sidebar de navegación
- Barra móvil siempre muestra **exactamente 5 iconos**. Si algún ítem está oculto por permisos (p.ej. propietario-only), se rellena automáticamente con el siguiente ítem disponible.
- Interfaz `NavItem` tipada correctamente; eliminados todos los `as any` del sidebar.

### Artistas — subida de avatar
- Diálogo de edición incluye círculo de avatar con overlay de cámara al hacer hover.
- Al seleccionar imagen: se redimensiona a 256 px máx, se convierte a **WebP 0.85** en el cliente, y se sube al bucket `avatars` de Supabase Storage con `upsert: true`.
- El diálogo refleja el nuevo avatar inmediatamente sin necesidad de cerrarse.

### Calendario
- Corregido **desfase de fecha** al hacer clic en un día: eliminada la variable `dateStr` redundante; un único `useEffect([open, defaultDate])` sincroniza el formulario tanto al abrir como al resetear.
- `DatePickerInput` usa `value={form.date}` directamente.

### Sesiones, Finanzas, Clientes, Reservas web
- Eliminados **todos los `as any`** en `Sessions.tsx`, `Finances.tsx`, `Clients.tsx`, `ClientProfile.tsx` — los tipos ya estaban correctamente definidos en `SessionRow` / `ClientWithArtist`.
- **`formatLocalDate`** (nueva utilidad en `src/shared/lib/formatDate.ts`) reemplaza el patrón `new Date(str + "T00:00:00")` en 11 puntos del código, previniendo desfases UTC en fechas.
- `WebBookings.tsx`: mismo fix de formatLocalDate en 4 ocurrencias.

---

## Web Pública

### og:image en páginas de servicio
- `TatuajesPage`, `PiercingPage` y `LaserPage` incluyen ahora `ogImage` en `<SEOHead>` con URL absoluta generada a partir del import del asset Vite (`${SITE}${importedAsset}`).
- Los crawlers de redes sociales (Facebook, Twitter, WhatsApp) muestran imagen correcta al compartir estas URLs.

### Dimensiones de imágenes en Galería
- `ArtistCard` en `Gallery.tsx` tiene ahora `width={400}` `height={300}` — elimina el layout shift (CLS) y el aviso de Lighthouse de "missing explicit dimensions".

### SEO técnico
- `hreflang` correcto en todas las páginas (es / en), sin default a inglés.
- Canonical y alternate canonical en todas las rutas de servicio y blog.
- Schemas JSON-LD: `LocalBusiness`, `Service` (tatuajes, piercing, laser), `BreadcrumbList`, `FAQPage` (laser).
- Meta title/description únicos por idioma y por página.
- Sitemap XML y robots.txt configurados.

### Analytics
- Google Analytics 4 + Meta Pixel con **Consent Mode v2** (RGPD). Sin disparo hasta consentimiento explícito.
- Banner de cookies integrado en ambos idiomas.

---

## Infraestructura técnica

### Utilidad `formatLocalDate`
Centralizada en `src/shared/lib/formatDate.ts`. Formatea fechas `yyyy-MM-dd` como hora local, evitando que `new Date("2024-05-01")` se interprete como UTC y aparezca como "30 abril" en zonas UTC+1 o superior.

### Arquitectura de calendarios
`useArtistsWithServices.ts` obtiene `calendar_id` y `available_services` de los perfiles de Supabase y los merge sobre el array estático `ARTISTS`. La arquitectura está resuelta — solo falta introducir el `calendar_id` de Google Calendar para cada artista desde Admin → Artistas.

### Emails de contacto
El formulario web envía email al estudio al recibir una solicitud. Funciona en producción.

---

## Pendientes

| # | Tarea | Notas |
|---|-------|-------|
| Q1 | Rellenar `calendar_id` en Supabase para artistas restantes | Arquitectura lista, solo falta el dato |
| Q3 | Stock — movimientos de **entrada** / restock | Solo existe "salida" actualmente |
| Q10 | 2 nuevos posts de blog | "¿Cuánto duele un tatuaje?" y "Fine line vs blackwork" |

---

## Google Business / Reviews
- **5 reseñas** en Google My Business conseguidas. ✅
- Schema `aggregateRating` puede añadirse al JSON-LD de `LocalBusiness` cuando se quiera reflejar en resultados enriquecidos (futuro).
