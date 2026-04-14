# Guía: Google Calendar — Lowkey Tattoo

## Cómo funciona

La app usa una **cuenta de servicio de Google** (un "robot" con acceso a los calendarios que se le comparten). No requiere login OAuth ni contraseñas. Cada artista comparte su propio Google Calendar con esa cuenta de servicio, y la app puede leer y escribir eventos en él.

```
App → Supabase Edge Function → Google Calendar API (via cuenta de servicio)
```

---

## Estado actual

| Elemento | Estado |
|----------|--------|
| Cuenta de servicio | ✅ `lowkey-calendar-wr@lowkey-calendar.iam.gserviceaccount.com` |
| Credenciales en Supabase | ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| Edge function `google-calendar` | ✅ Desplegada en Supabase |
| Calendario de prueba (dev) | ✅ `lowkeytattootenerife@gmail.com` — usado para verificar la integración |
| Calendario de Pablo | ⏳ Pendiente |
| Calendario de Sergio | ⏳ Pendiente |
| Calendario de Fifo | ⏳ Pendiente |
| Calendario master (info@) | ⏳ Pendiente |

> La configuración inicial (cuenta de servicio + Supabase) ya está hecha. El calendario `lowkeytattootenerife@gmail.com` se usó para probar que la integración funciona correctamente. Ahora hay que repetir los pasos de abajo para cada artista real.

---

## Parte 1 — Conectar el calendario de un artista

Estos pasos los hace **el propio artista** con su cuenta de Google.

### Paso 1 — Crear un calendario de trabajo (si no tiene uno)

1. El artista abre [calendar.google.com](https://calendar.google.com)
2. Panel izquierdo → junto a **"Otros calendarios"** → clic en **"+"**
3. Seleccionar **"Crear nuevo calendario"**
4. Nombre: `Lowkey - [Nombre]` (ej. `Lowkey - Sergio`)
5. Clic en **"Crear calendario"**

> Si el artista quiere usar directamente su calendario personal (el principal), puede saltarse este paso. El Calendar ID del calendario principal es simplemente su dirección de Gmail.

---

### Paso 2 — Compartir el calendario con la cuenta de servicio

> Este paso es obligatorio. Sin él la app no puede leer ni crear eventos.

1. En el panel izquierdo, pasar el ratón por el calendario creado → clic en los **tres puntos** → **"Configuración y uso compartido"**
2. Bajar hasta **"Compartir con personas o grupos específicos"**
3. Clic en **"+ Agregar personas"**
4. Introducir exactamente esta dirección:
   ```
   lowkey-calendar-wr@lowkey-calendar.iam.gserviceaccount.com
   ```
5. Permisos: **"Hacer cambios en los eventos"**
6. Clic en **"Enviar"**

---

### Paso 3 — Obtener el Calendar ID

1. En la misma pantalla de configuración, bajar hasta la sección **"Integrar el calendario"**
2. Copiar el valor de **"ID del calendario"**
   - Si es el calendario principal: será su dirección de Gmail (ej. `sergio@gmail.com`)
   - Si es un calendario secundario: tendrá el formato `xxxxxxxxxx@group.calendar.google.com`

---

### Paso 4 — Pegarlo en el admin de la app

1. Entrar en el panel admin → **Artistas**
2. Clic en el icono de editar del artista
3. Pegar el Calendar ID en el campo **"Google Calendar ID"**
4. Clic en **"Guardar"**

A partir de ahora:
- El artista verá su calendario en **Admin → Calendario**
- El formulario de reservas web bloqueará automáticamente sus días ocupados
- Al confirmar una cita web, el evento se creará directamente en su calendario

---

## Parte 2 — Calendario master para ver todos los artistas a la vez

Útil para el owner o para la cuenta `info@tattoolowkey.com`: ver todas las citas de todos los artistas en una sola vista.

### Opción A — Solo en Google Calendar (sin tocar la app)

Desde la cuenta `info@tattoolowkey.com`:

1. Ir a [calendar.google.com](https://calendar.google.com)
2. Panel izquierdo → **"Otros calendarios" → "+" → "Suscribirse al calendario"**
3. Introducir el **Calendar ID** de cada artista y suscribirse
4. Repetir para cada artista

Resultado: `info@` ve todos los calendarios superpuestos con colores distintos por artista.

---

### Opción B — Calendario master en la app

Para que el owner vea todas las citas desde **Admin → Calendario**:

1. Desde `info@tattoolowkey.com` → Google Calendar → **Crear nuevo calendario** llamado `Lowkey Tattoo — General`
2. Obtener su Calendar ID (sección "Integrar el calendario")
3. Compartirlo con la cuenta de servicio con permiso **"Hacer cambios en los eventos"**:
   ```
   lowkey-calendar-wr@lowkey-calendar.iam.gserviceaccount.com
   ```
4. En **Admin → Artistas** → editar el perfil del owner → pegar el Calendar ID del calendario general
5. Cada artista también comparte su calendario con `info@tattoolowkey.com` con permiso **"Ver todos los detalles"** para que los eventos aparezcan en la vista combinada

---

## Parte 3 — Enviar invitaciones desde el panel

Una vez configurado el calendario de cada artista, el panel permite enviar invitaciones de Google Calendar directamente desde dos sitios:

### Desde Calendario (Admin → Calendario)

Al crear una cita manual aparece la sección **"Invitar artista"**. Los artistas con email configurado aparecen como píldoras clicables. Al seleccionar uno o varios y crear el evento:
- El evento se crea en el calendario del usuario logueado
- Google Calendar envía automáticamente una invitación por email a cada artista seleccionado
- El artista puede **Aceptar**, **Rechazar** o **Proponer nuevo horario** desde su email, sin necesidad de usar la app

### Desde Sesiones (Admin → Sesiones)

Al crear o editar una sesión con un artista asignado que tenga calendario y email configurados, aparece el toggle **"Enviar invitación de Google Calendar"**. Al activarlo:
- Se muestra un campo de hora de inicio
- Al guardar la sesión, se crea el evento en el calendario del artista con los detalles de la sesión
- Google Calendar envía la invitación al artista por email

> Si el artista no tiene `calendar_id` ni email configurado en su perfil, el toggle no aparece.

---

## Parte 4 — Festivos locales

Los festivos nacionales y de Canarias ya están hardcodeados en `src/shared/config/holidays.ts`.

Para los **festivos locales de Santa Cruz de Tenerife**, añadirlos en Google Calendar como eventos de día completo. La app los detectará y bloqueará esos días en el formulario de reservas:

1. En Google Calendar → crear evento en la fecha del festivo
2. Marcar como **"Todo el día"** (sin hora)
3. Título descriptivo: ej. `Festivo — Carnaval`
4. Marcar como **"No disponible"**

---

## Resumen de Calendar IDs

| Artista | Calendar ID | Estado |
|---------|------------|--------|
| Pablo | `lowkeytattootenerife@gmail.com` | ✅ Activo |
| Sergio | — | ⏳ Pendiente |
| Fifo | — | ⏳ Pendiente |
| Master (info@) | — | ⏳ Pendiente |

---

## Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El artista no ve el Calendario en el sidebar | No tiene `calendar_id` asignado en su perfil | Completar el Paso 4 de arriba |
| "Error al cargar el calendario" | Calendar ID incorrecto o no compartido | Verificar Paso 2 y Paso 3 |
| Los días no se bloquean en la reserva web | El calendario no tiene eventos o no está compartido | Verificar que el Paso 2 se hizo correctamente |
| Error 403 al crear un evento | La cuenta de servicio no tiene permiso en ese calendario | Repetir el Paso 2 |
| Error 404 | Calendar ID con error tipográfico | Copiar de nuevo desde Google Calendar |
