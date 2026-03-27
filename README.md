# Lowkey Tattoo — Web + Admin

Web pública del estudio Lowkey Tattoo (Madrid) y panel de administración interno.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Animaciones | Framer Motion |
| Routing | React Router v6 |
| Estado servidor | TanStack React Query v5 |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Email | EmailJS |
| Fuentes | IBM Plex Sans, IBM Plex Mono, Pirata One |

---

## Estructura del proyecto

```
src/
  web/              ← Web pública (visible en /)
    components/     ← Navbar, Hero, Gallery, BookingModal, etc.
    pages/          ← Index.tsx, NotFound.tsx
    contexts/       ← BookingContext, CookieConsentContext
    hooks/          ← useInstagramFeed, useCalendarAvailability, etc.
    i18n/           ← I18nProvider, translations (ES/EN)
    lib/            ← analytics.ts, email.ts
    data/           ← instagramFeed.ts
    config/         ← contact.ts
  admin/            ← Panel admin (visible en /admin/*)
    components/     ← AdminLayout, AdminSidebar, ProtectedRoute, RoleGuard, StockAlertBadge
    pages/          ← Login, Dashboard, Clients, ClientProfile, Sessions, Finances, Stock, Artists, WebBookings
    contexts/       ← AdminAuthContext
    hooks/          ← useClients, useSessions, useFinances, useStock, useArtistProfiles
  shared/           ← Código compartido entre web y admin
    lib/            ← supabase.ts, utils.ts
    config/         ← artists.ts
    types/          ← index.ts (tipos Supabase)
  components/ui/    ← shadcn (no modificar)
  lib/utils.ts      ← re-export de @shared/lib/utils (necesario para shadcn)
  App.tsx           ← Router raíz con todas las rutas
  main.tsx
  index.css
```

### Alias de paths

| Alias | Apunta a |
|-------|---------|
| `@` | `src/` |
| `@web` | `src/web/` |
| `@admin` | `src/admin/` |
| `@shared` | `src/shared/` |

---

## Puesta en marcha local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

Vite carga automáticamente `.env.local` en desarrollo y nunca se commitea (cubierto por `*.local` en `.gitignore`).

Ver sección [Variables de entorno](#variables-de-entorno) para instrucciones detalladas.

### 3. Base de datos (Supabase)

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar todo el contenido de `supabase/schema.sql`
3. Crear el bucket de Storage `client-photos` (privado) — ver `supabase/README.md`
4. Crear el primer usuario owner — ver [Primer acceso al admin](#primer-acceso-al-admin)

> Para el detalle completo de cada paso con comandos SQL de verificación, ver `SETUP.md`.

### 4. Servidor de desarrollo

```bash
npm run dev
```

La app corre en `http://localhost:8080`.

---

## Variables de entorno

Todas las variables van en `.env` (nunca se commitean — están en `.gitignore`).

Archivo: `.env.local` (no `.env` — Vite prioriza `.env.local` y está en `.gitignore` vía `*.local`)

```env
# ── Supabase ─────────────────────────────────────────────────────────────────
# Supabase Dashboard → Project Settings → API
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── EmailJS ───────────────────────────────────────────────────────────────────
# https://www.emailjs.com → Free tier: 200 emails/mes
# 1. Crear cuenta → Add Email Service (Gmail) → copiar Service ID
# 2. Crear Template con variables: {{artist_name}}, {{artist_email}},
#    {{client_name}}, {{client_phone}}, {{client_email}}, {{date}}, {{time}},
#    {{description}}, {{body_zone}}, {{is_first_time}}
# 3. Account → API Keys → Public Key
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=

# ── Google Calendar (opcional) ────────────────────────────────────────────────
# Google Cloud Console → APIs → Calendar API → Credentials → API Key
# Restringir a: HTTP referrers (tu dominio)
# Cada calendario de artista debe estar compartido como "libre/ocupado" público
VITE_GOOGLE_CALENDAR_API_KEY=
```

---

## Base de datos — Schema

El schema completo está en `supabase/schema.sql`. Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Extensión de `auth.users` — nombre, rol (owner/artist), config_id |
| `clients` | Clientes del estudio |
| `sessions` | Sesiones de tatuaje, piercing, láser, retoque |
| `client_photos` | Fotos en Supabase Storage |
| `products` | Inventario |
| `stock_movements` | Entradas/salidas de stock |
| `web_bookings` | Citas llegadas por el formulario web |

### RLS (Row Level Security)

| Tabla | Owner | Artist |
|-------|-------|--------|
| profiles | Leer todos, editar propio | Leer todos, editar propio |
| clients | CRUD todos | CRUD donde `primary_artist_id = uid()` |
| sessions | CRUD todos | CRUD donde `artist_id = uid()` |
| products | CRUD todos | Solo lectura |
| stock_movements | CRUD todos | Solo insertar salidas |
| web_bookings | CRUD todos | Ver/editar las suyas |

### Storage

- Bucket: `client-photos` (privado)
- Path: `clients/{client_id}/{photo_id}.jpg`

**Crear el bucket:**
1. Supabase Dashboard → Storage → New bucket
2. Nombre: `client-photos`
3. Desmarcar "Public bucket"
4. Añadir policy: autenticados pueden SELECT/INSERT/UPDATE/DELETE en `clients/**`

---

## Panel Admin

### Rutas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/admin/login` | Login email + password | Público |
| `/admin/dashboard` | KPIs + gráficas + últimas sesiones | Todos |
| `/admin/clients` | Lista de clientes | Todos |
| `/admin/clients/:id` | Perfil: fotos, historial, edición | Todos |
| `/admin/sessions` | Log de sesiones con filtros | Todos |
| `/admin/finances` | Ingresos, gráficas, pendientes, CSV | Todos |
| `/admin/stock` | Inventario + alertas mínimo | Todos |
| `/admin/artists` | Gestión de cuentas del equipo | Solo owner |
| `/admin/bookings` | Citas del formulario web | Todos |

### Roles

- **owner** — acceso total, ve datos de todos los artistas
- **artist** — solo ve sus propios clientes, sesiones e ingresos

### Primer acceso al admin

1. Ir a Supabase Dashboard → Authentication → Users → Add user
2. Crear usuario con email y contraseña
3. Ir a SQL Editor y ejecutar:
   ```sql
   UPDATE profiles SET role = 'owner' WHERE id = '<user-uuid>';
   ```
4. Acceder a `/admin/login`

---

## Despliegue

### Build de producción

```bash
npm run build
# Genera dist/ — servir como SPA estática
```

### Vercel / Netlify

- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno: añadir las del `.env` en el dashboard
- Rewrite rule SPA: todas las rutas → `index.html`

  **Netlify** (`public/_redirects`):
  ```
  /* /index.html 200
  ```

  **Vercel** (`vercel.json`):
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

---

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo (puerto 8080)
npm run build      # Build de producción
npm run preview    # Preview del build
npm run test       # Tests (Vitest)
npm run lint       # ESLint
```

---

## Tests

Tests en `src/test/` — ejecutar con:

```bash
npm run test
```

E2E con Playwright:

```bash
npx playwright test
```
