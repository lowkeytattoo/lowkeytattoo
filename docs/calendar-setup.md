# Configuración de Calendarios — Lowkey Tattoo

## Índice
1. [Configuración inicial (ya hecho)](#1-configuración-inicial-ya-hecho)
2. [Añadir calendario de un nuevo artista](#2-añadir-calendario-de-un-nuevo-artista)
3. [Invitaciones desde el panel](#3-invitaciones-desde-el-panel)
4. [Configurar info@ para ver todos los calendarios](#4-configurar-info-para-ver-todos-los-calendarios)
5. [Festivos locales](#5-festivos-locales)

---

## 1. Configuración inicial (ya hecho)

- ✅ Cuenta de servicio de Google creada: `lowkey-calendar-wr@lowkey-calendar.iam.gserviceaccount.com`
- ✅ Credenciales guardadas en Supabase (secrets: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`)
- ✅ Edge function `google-calendar` desplegada en Supabase
- ✅ Calendario de prueba (dev) vinculado: `lowkeytattootenerife@gmail.com` — para verificar que la integración funciona
- ✅ Cada artista ve solo su propio calendario en el panel (basado en su `calendar_id`)
- ✅ Invitaciones de Google Calendar enviables desde Admin → Calendario y Admin → Sesiones

---

## 2. Añadir calendario de un nuevo artista

Pasos que hace **el artista**:

### 2.1 Crear el calendario en Google
1. Ir a [calendar.google.com](https://calendar.google.com) con su cuenta personal
2. En el panel izquierdo → **"Otros calendarios" → "+"→ "Crear nuevo calendario"**
3. Nombre sugerido: `Lowkey - [Nombre]` (ej. `Lowkey - Sergio`)
4. Guardar

### 2.2 Compartir con la cuenta de servicio
1. En el panel izquierdo, hacer clic en los **tres puntos** del calendario recién creado → **"Configuración y uso compartido"**
2. Bajar hasta **"Compartir con personas o grupos específicos"**
3. Añadir: `lowkey-calendar-wr@lowkey-calendar.iam.gserviceaccount.com`
4. Permiso: **"Hacer cambios en los eventos"**
5. Guardar

### 2.3 Obtener el Calendar ID
1. En la misma página de configuración, bajar hasta **"Integrar el calendario"**
2. Copiar el **"ID del calendario"** (puede ser el email del artista o algo como `abc123@group.calendar.google.com`)

### 2.4 Vincular en el admin de la app
1. Entrar en **Admin → Artistas**
2. Editar el artista correspondiente
3. Pegar el Calendar ID en el campo **"Google Calendar ID"**
4. Guardar

✅ Listo. El sistema ya detectará su disponibilidad automáticamente.

---

## 3. Invitaciones desde el panel

Una vez configurado el calendario del artista, el panel soporta dos flujos de invitación nativos de Google Calendar:

### Desde Admin → Calendario
Al crear una cita manual, aparece la sección **"Invitar artista"**. Seleccionar uno o varios artistas → al crear el evento, Google les manda la invitación por email. El artista acepta/rechaza desde su email sin tocar la app.

### Desde Admin → Sesiones
Al crear o editar una sesión, si el artista asignado tiene `calendar_id` y email en su perfil, aparece el toggle **"Enviar invitación de Google Calendar"**. Al activarlo y poner la hora de inicio, al guardar la sesión se crea el evento en su calendario y Google le manda la invitación.

> Para que el flujo de invitaciones funcione, el artista necesita tener configurado tanto el `calendar_id` como el email en **Admin → Artistas**. El email se configura en `src/shared/config/artists.ts`.

---

## 4. Configurar info@ para ver todos los calendarios

### 3.1 Suscribirse a los calendarios de cada artista (vista en Google Calendar)

Desde la cuenta `info@tattoolowkey.com`:

1. Ir a [calendar.google.com](https://calendar.google.com)
2. En el panel izquierdo → **"Otros calendarios" → "+" → "Suscribirse al calendario"**
3. Introducir el **Calendar ID** de cada artista (el mismo que se puso en el admin)
4. Repetir para cada artista

Resultado: `info@` ve todos los calendarios en una sola vista con colores distintos por artista.

### 3.2 Calendario "master" para la app (opcional)

Para que la página de Calendario del admin muestre todos los calendarios a la vez desde la cuenta `info@`:

1. En `info@tattoolowkey.com` → Google Calendar → **Crear nuevo calendario** llamado `Lowkey Tattoo — General`
2. Cada artista comparte su calendario con `info@tattoolowkey.com` con permiso de **"Ver todos los detalles"**
3. Google Calendar permite crear una **vista combinada** exportable

> **Alternativa más simple:** cada artista añade sus eventos al calendario de `info@` directamente. Requiere coordinación del equipo.

### 3.3 Vincular el calendario master en la app
1. Obtener el Calendar ID del calendario `Lowkey Tattoo — General`
2. Compartirlo con la cuenta de servicio (`lowkey-calendar-wr@...`) con permiso **"Hacer cambios en los eventos"**
3. En **Admin → Artistas** → editar el perfil de `info@` → poner ese Calendar ID

---

## 5. Festivos locales

Los festivos nacionales y de Canarias ya están hardcodeados en la app (`src/shared/config/holidays.ts`).

Los **festivos locales de Santa Cruz de Tenerife** hay que añadirlos manualmente al calendario de Google de cada artista como **eventos de día completo**. La app los detectará automáticamente y bloqueará esos días en el modal de reserva web.

Ejemplo: si el 3 de febrero es festivo local, crear en Google Calendar:
- Título: `Festivo — Día de la ciudad`
- Fecha: 3 de febrero (evento de día completo, sin hora)
- Marcar como **"No disponible"**

---

## Resumen de Calendar IDs actuales

| | Calendar ID | Estado |
|--|------------|--------|
| Owner / info@ (master) | `lowkeytattootenerife@gmail.com` | ✅ Activo |
| Pablo | — | ⏳ Pendiente |
| Sergio | — | ⏳ Pendiente |
| Fifo | — | ⏳ Pendiente |

> `info@tattoolowkey.com` es un alias de reenvío vía ImprovMX → `lowkeytattootenerife@gmail.com`. No es una cuenta de Google independiente, por lo que su Calendar ID es el del Gmail. Ya está configurado y compartido con la cuenta de servicio.
