# Lowkey Tattoo — Setup & Pendientes

Documento de referencia para poner en producción la app.

---

## Estado actual (25 Mar 2026)

| Elemento | Estado |
|----------|--------|
| Código / build | ✅ Completo — `npm run build` sin errores |
| Supabase proyecto | ✅ Creado (`zvgqgirfhskndnghowot.supabase.co`) |
| Supabase schema SQL | ✅ Ejecutado |
| 7 tablas en DB | ✅ Confirmadas (`profiles`, `clients`, `sessions`, `client_photos`, `products`, `stock_movements`, `web_bookings`) |
| Trigger `on_auth_user_created` | ✅ Verificado |
| RLS activo en todas las tablas | ✅ `rowsecurity = true` en todas |
| Storage bucket `client-photos` | ✅ Creado y funcionando (privado) |
| Variables de entorno locales | ✅ En `.env.local` |
| EmailJS | ⏳ Pendiente |
| Google Calendar | ⏳ Pendiente (opcional) |
| Usuarios admin creados | ⏳ Pendiente |
| Despliegue a producción | ⏳ Pendiente |

---

## Checklist de puesta en producción

### 1. Supabase — base de datos

- [x] Crear proyecto en [supabase.com](https://supabase.com)
- [x] Ejecutar `supabase/schema.sql` en SQL Editor
- [x] Añadir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a `.env.local`
- [x] Verificar en Supabase → Table Editor que existen las 7 tablas:
  `profiles`, `clients`, `sessions`, `client_photos`, `products`, `stock_movements`, `web_bookings`
- [x] Verificar que el trigger `on_auth_user_created` existe:
  ```sql
  SELECT trigger_name FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  ```
- [x] Verificar que RLS está activo en todas las tablas:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' ORDER BY tablename;
  ```
  — todas deben mostrar `rowsecurity = true`

### 2. Supabase — Storage

- [x] Ir a Storage → New bucket
  - Nombre: `client-photos`
  - Public bucket: **NO** (privado)
- [x] Añadir policy de acceso (Storage → Policies → New policy sobre `client-photos`):
  ```sql
  CREATE POLICY "authenticated users full access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'client-photos')
  WITH CHECK (bucket_id = 'client-photos');
  ```
- [ ] Probar subida de foto desde `/admin/clients/:id` → debe aparecer en el grid

### 3. Usuarios admin

- [ ] Authentication → Users → Add user (email + contraseña) para el **owner**
- [ ] Asignar rol owner en SQL Editor:
  ```sql
  UPDATE profiles SET role = 'owner' WHERE id = '<uuid-del-usuario>';
  ```
  *(El UUID aparece en Authentication → Users → columna "UID")*
- [ ] Probar login en `/admin/login` con esa cuenta
- [ ] Crear usuarios para cada artista (Pablo, Sergio, Fifo)
- [ ] En `/admin/artists`, vincular `artist_config_id` de cada uno:
  - Pablo → `pablo`
  - Sergio → `sergio`
  - Fifo → `fifo`
- [ ] Verificar que un artista NO puede acceder a `/admin/artists` (redirige a dashboard)

### 4. EmailJS

- [ ] Crear cuenta en [emailjs.com](https://www.emailjs.com) (free: 200 emails/mes)
- [ ] Add Email Service → conectar Gmail del estudio
- [ ] Create Email Template con estas variables exactas:
  ```
  {{artist_name}}, {{artist_email}}, {{client_name}}, {{client_phone}},
  {{client_email}}, {{date}}, {{time}}, {{description}}, {{body_zone}}, {{is_first_time}}
  ```
- [ ] Añadir al `.env.local`:
  ```
  VITE_EMAILJS_SERVICE_ID=service_xxxxx
  VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
  VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxx
  ```
- [ ] Probar envío de cita desde el formulario web (BookingModal)
- [ ] Verificar que la cita llega al email Y aparece en `/admin/bookings` como "Pendiente"

### 5. Google Calendar (opcional)

Sin esta configuración, el selector de horas muestra slots genéricos. Para disponibilidad real:

- [ ] Google Cloud Console → APIs → Calendar API → Credentials → API Key
- [ ] Restringir la key a tu dominio de producción
- [ ] Compartir los calendarios de cada artista como "libre/ocupado" público
- [ ] Rellenar `calendarId` de cada artista en `src/shared/config/artists.ts`
- [ ] Añadir al `.env.local`: `VITE_GOOGLE_CALENDAR_API_KEY=xxxxxxxxxx`
- [ ] Verificar que el selector de hora muestra slots reales

### 6. Despliegue (Vercel recomendado)

- [ ] Conectar el repo de GitHub a [vercel.com](https://vercel.com)
- [ ] En Vercel → Settings → Environment Variables, añadir todas las del `.env.local`
- [ ] Framework Preset: **Vite** — Build command: `npm run build` — Output: `dist`
- [ ] Añadir rewrite SPA en `vercel.json` (si no lo detecta automáticamente):
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- [ ] Conectar dominio personalizado → Settings → Domains
- [ ] Verificar HTTPS activo
- [ ] Smoke test en producción:
  - [ ] Web pública carga (`/`)
  - [ ] Modal de cita envía email
  - [ ] `/admin/login` funciona
  - [ ] Subida de fotos funciona

### 7. Artistas — datos reales

- [ ] Verificar emails en `src/shared/config/artists.ts` (actualmente son placeholder)
- [ ] Verificar handles de Instagram
- [ ] Actualizar teléfono/dirección en `src/web/config/contact.ts` si cambia

---

## Checklist de verificación funcional (pre-lanzamiento)

Marcar una vez el admin está en producción y hay usuarios reales:

- [ ] `npm run build` — sin errores ni warnings de tipos
- [ ] Web pública — funciona igual que antes, sin referencias al admin
- [ ] `/admin/login` con credenciales correctas → redirige a `/admin/dashboard`
- [ ] `/admin/login` con credenciales incorrectas → error inline visible
- [ ] Acceder a `/admin/dashboard` sin login → redirige a `/admin/login`
- [ ] Owner: ve ingresos globales de todos los artistas
- [ ] Owner: puede acceder a `/admin/artists`
- [ ] Artist: solo ve sus propios clientes y sesiones
- [ ] Artist: `/admin/artists` redirige a `/admin/dashboard`
- [ ] Crear cliente → aparece en lista
- [ ] Subir foto en perfil de cliente → aparece en grid (guardada en Storage)
- [ ] Registrar sesión → aparece en `/admin/sessions`
- [ ] Toggle "pagado" en sesión → cambia estado inmediatamente
- [ ] Producto con `quantity <= min_quantity` → badge rojo en sidebar
- [ ] Registrar uso de producto → `quantity` disminuye correctamente
- [ ] Enviar cita desde web pública → aparece en `/admin/bookings` como "pending"
- [ ] Convertir cita → estado cambia a "confirmed", sesión creada
- [ ] Export CSV en Finanzas → descarga fichero correcto
- [ ] Cerrar sesión → redirige a `/admin/login`

---

## Mejoras futuras (backlog)

### Funcionalidades admin

- [ ] **Sidebar colapsable en mobile** — el diseño está preparado, falta botón hamburguesa
- [ ] **Eliminar cliente** con confirmación en cascada
- [ ] **Foto de perfil** para artistas (upload a Storage)
- [ ] **Paginación** en tablas grandes (>100 registros)
- [ ] **Búsqueda** en página de Sesiones
- [ ] **Notificación** al llegar cita web nueva (email/push vía Supabase Edge Function)
- [ ] **Resumen semanal** automático por email
- [ ] **Export PDF** de ficha de cliente

### Técnico

- [ ] **Code splitting** con `React.lazy` para páginas admin (reduce bundle inicial)
- [ ] **Error boundaries** en páginas admin
- [ ] **Tests** para hooks admin (Vitest + MSW)
- [ ] **Rate limiting** en formulario de citas (evitar spam)

---

## Notas de seguridad

- `.env.local` está ignorado por `.gitignore` (cubre `*.local`) — nunca se commitea
- Usar siempre la **anon key** en el frontend (nunca la `service_role` key)
- Las RLS policies en Supabase garantizan que los artistas solo accedan a sus propios datos aunque alguien manipule la anon key
- El panel admin en `/admin/*` no tiene ningún enlace desde la web pública
