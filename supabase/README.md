# Supabase — Base de datos Lowkey Tattoo

## Pasos de configuración

### 1. Ejecutar el schema

En el SQL Editor de Supabase, ejecutar `schema.sql` completo (en ese orden):

1. Tablas
2. Trigger de auto-creación de perfil
3. RLS (habilitar + policies)
4. *(Storage se configura desde el dashboard)*

### 2. Verificar tablas creadas

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Debe devolver: `client_photos`, `clients`, `products`, `profiles`, `sessions`, `stock_movements`, `web_bookings`

### 3. Crear bucket de Storage

En **Storage → New bucket**:
- Name: `client-photos`
- Public bucket: **NO**

Añadir policy (Storage → Policies → New policy):
```sql
-- Authenticated users can do everything in their clients folder
CREATE POLICY "authenticated access client-photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'client-photos')
WITH CHECK (bucket_id = 'client-photos');
```

### 4. Crear primer usuario owner

```sql
-- Después de crear el usuario en Authentication → Users:
UPDATE profiles
SET role = 'owner'
WHERE id = 'UUID_DEL_USUARIO';
```

---

## Tablas

### `profiles`

Extensión de `auth.users`. Se crea automáticamente al registrar un usuario vía trigger.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | FK → auth.users |
| display_name | TEXT | Nombre mostrado en el admin |
| role | TEXT | `owner` o `artist` |
| artist_config_id | TEXT | `pablo`, `sergio` o `fifo` — vincula con `src/shared/config/artists.ts` |
| avatar_url | TEXT | URL de foto de perfil |

### `clients`

| Campo | Tipo |
|-------|------|
| id | UUID (PK) |
| name | TEXT |
| phone | TEXT |
| email | TEXT |
| notes | TEXT |
| allergies | TEXT |
| birthday | DATE |
| primary_artist_id | UUID → profiles |

### `sessions`

| Campo | Tipo | Notas |
|-------|------|-------|
| type | TEXT | `tattoo`, `piercing`, `laser`, `retoque` |
| price | DECIMAL | Precio total |
| deposit | DECIMAL | Señal recibida |
| paid | BOOLEAN | ¿Cobrado completo? |
| body_zone | TEXT | Zona del cuerpo |
| style | TEXT | Estilo del tatuaje |

### `products`

| Campo | Tipo | Notas |
|-------|------|-------|
| category | TEXT | `tinta`, `aguja`, `piercing_joyeria`, `cuidado`, `higiene`, `equipo`, `otro` |
| quantity | DECIMAL | Stock actual |
| min_quantity | DECIMAL | Umbral de alerta |
| unit | TEXT | `ud`, `ml`, `caja`, etc. |

> El badge de stock bajo en el sidebar se activa cuando `quantity <= min_quantity`.

### `stock_movements`

Cada vez que se registra un uso (`type = 'salida'`) o reposición (`type = 'entrada'`), se crea un movimiento. El hook `useCreateStockMovement` actualiza automáticamente `products.quantity`.

### `web_bookings`

Se crea automáticamente cuando alguien envía el formulario de cita de la web pública. `status` empieza en `pending` y puede pasar a `confirmed` o `cancelled` desde `/admin/bookings`.

---

## RLS — Resumen

| Tabla | Owner | Artist |
|-------|-------|--------|
| profiles | SELECT all, UPDATE own | SELECT all, UPDATE own |
| clients | CRUD all | CRUD where `primary_artist_id = uid()` |
| sessions | CRUD all | CRUD where `artist_id = uid()` |
| client_photos | CRUD all | CRUD via sessions/clients propios |
| products | CRUD all | SELECT only |
| stock_movements | CRUD all | INSERT only |
| web_bookings | CRUD all | SELECT/UPDATE donde `artist_config_id` = suyo |

> `web_bookings` tiene además una policy de INSERT para `anon` — permite que el formulario público guarde sin autenticación.

---

## Notas importantes

- **Nunca exponer la `service_role` key** — solo usar `anon` key en el frontend.
- Si las policies RLS no se aplican correctamente, verificar que `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` se ejecutó para cada tabla.
- El trigger `on_auth_user_created` crea el perfil con `role = 'artist'` por defecto. Cambiar manualmente a `owner` el primer usuario.
