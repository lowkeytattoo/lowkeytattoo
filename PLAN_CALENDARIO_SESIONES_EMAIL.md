# Plan: Calendario → Cliente + Sesión + Notificaciones Email + Color de eventos
> Documento exhaustivo paso a paso — Lowkey Tattoo

---

## Índice

1. [Estado actual y diagnóstico](#1-estado-actual-y-diagnóstico)
2. [Configurar recepción de emails corporativos](#2-configurar-recepción-de-emails-corporativos)
3. [Nuevos templates EmailJS](#3-nuevos-templates-emailjs)
4. [Variables de entorno nuevas](#4-variables-de-entorno-nuevas)
5. [Color de eventos: identificar citas creadas desde la app](#5-color-de-eventos-identificar-citas-creadas-desde-la-app)
6. [Edge Function: soporte PATCH en Google Calendar](#6-edge-function-soporte-patch-en-google-calendar)
7. [Hook useUpdateCalendarEvent](#7-hook-useupdatecalendarevent)
8. [Capa de email: calendarEmail.ts](#8-capa-de-email-calendaremailts)
9. [SessionFromEventModal](#9-sessionfromeventmodal)
10. [EventActionPanel + Calendar.tsx](#10-eventactionpanel--calendartsx)
11. [BookingToSessionModal + WebBookings.tsx](#11-bookingtosessionmodal--webbookingstsx)
12. [Envío de email al crear/modificar evento (sin sesión)](#12-envío-de-email-al-crearmodificar-evento-sin-sesión)
13. [Pruebas end-to-end](#13-pruebas-end-to-end)
14. [Orden de implementación resumido](#14-orden-de-implementación-resumido)

---

## 1. Estado actual y diagnóstico

### Lo que ya funciona
| Módulo | Estado |
|--------|--------|
| ImprovMX (reenvío MX) | ✅ Configurado — emails a `*@tattoolowkey.com` llegan a Gmail personal de cada artista |
| Brevo SMTP | ✅ Configurado — permite enviar _desde_ dirección corporativa |
| EmailJS service `service_bkvljlx` | ✅ Activo |
| Template reserva web `template_w8lc91i` | ✅ Funciona — notifica al artista cuando llega una reserva |
| Google Calendar (Edge Function) | ✅ GET + POST + DELETE funcionando |

### Lo que falta
| Gap | Dónde impacta |
|-----|---------------|
| EmailJS solo envía al artista, no hay copia al admin | Reservas web y todos los flujos nuevos |
| `info@tattoolowkey.com` no tiene configurado "Enviar como" en Gmail | Para que el admin pueda responder desde esa cuenta |
| No existe template EmailJS para eventos de calendario | Flujos nuevos |
| No existe template EmailJS para confirmar reserva web | Flujo BookingToSessionModal |
| Edge Function no soporta PATCH (actualizar evento) | Renombrar evento al vincular cliente |
| `useUpdateCalendarEvent` no existe | Misma razón |
| No existe flujo directo calendario → cliente + sesión | Feature principal |
| `BookingToSessionModal` no existe | Confirmar reserva web como sesión |

---

## 2. Configurar recepción de emails corporativos

> Objetivo: que tanto `pablo@tattoolowkey.com` (artistas) como `info@tattoolowkey.com` (admin/owner) puedan **recibir Y responder** emails desde sus cuentas Gmail personales.

El proceso tiene **dos partes independientes** para cada dirección corporativa:
- **Recibir:** ImprovMX reenvía los emails entrantes al Gmail personal.
- **Enviar / responder:** Gmail "Enviar como" via Brevo SMTP para que el _From_ sea la dirección corporativa.

---

### 2.1 Configurar `pablo@tattoolowkey.com` ↔ Gmail de Pablo

#### Parte A — Recibir (ImprovMX)

1. Ve a **[improvmx.com](https://improvmx.com)** → inicia sesión con la cuenta del owner del dominio.
2. Selecciona el dominio `tattoolowkey.com`.
3. En la lista de alias, comprueba que existe:
   ```
   pablo  →  gmail-personal-de-pablo@gmail.com
   ```
   Si no existe, haz clic en **"Add an alias"** y añádelo.
4. Prueba: envía un email desde cualquier cuenta a `pablo@tattoolowkey.com` y verifica que llega al Gmail de Pablo.

#### Parte B — Enviar / responder (Gmail "Enviar como")

1. Pablo abre su **Gmail personal** → ⚙️ (arriba a la derecha) → **"Ver toda la configuración"**.
2. Pestaña **"Cuentas e importación"** → sección **"Enviar correo como"** → **"Añadir otra dirección de correo electrónico"**.
3. Rellena el formulario:
   - **Nombre:** `Pablo — Lowkey Tattoo` (o el que prefiera)
   - **Dirección de correo:** `pablo@tattoolowkey.com`
   - **Desmarca** la casilla "Tratar como alias" → clic en **"Siguiente paso"**.
4. Introduce los datos SMTP de Brevo:
   | Campo | Valor |
   |-------|-------|
   | Servidor SMTP | `smtp-relay.brevo.com` |
   | Puerto | `587` |
   | Nombre de usuario | El **email con el que Pablo se registró en Brevo** (o el del owner si comparten cuenta Brevo) |
   | Contraseña | La **clave SMTP de Brevo** → Brevo Dashboard → SMTP & API → SMTP Keys → copiar o generar una |
   | Seguridad | **TLS** (recomendado) |
5. Clic en **"Añadir cuenta"**.
6. Gmail envía un **código de verificación** al correo `pablo@tattoolowkey.com` → gracias a ImprovMX (parte A) ese email llega al Gmail de Pablo → **copia el código** e introdúcelo en el campo que aparece.
7. ✅ Listo. Cuando Pablo responda a un email, verá que puede elegir desde qué dirección enviar. Para que use `pablo@tattoolowkey.com` por defecto al responder a emails enviados a esa cuenta, activa **"Responder desde la misma dirección a la que se envió el mensaje"** (en la misma pestaña).

> **Nota Brevo:** Si Pablo no tiene cuenta propia en Brevo, puede usar la misma cuenta del owner. En ese caso el campo usuario y contraseña SMTP son los del owner. Brevo permite enviar desde múltiples remitentes con una sola cuenta (siempre que el dominio esté verificado, lo que ya está hecho).

---

### 2.2 Configurar `info@tattoolowkey.com` ↔ Gmail del owner

#### Parte A — Recibir (ImprovMX)

1. En el mismo panel de ImprovMX → dominio `tattoolowkey.com`.
2. Comprueba que existe el alias:
   ```
   info  →  gmail-personal-del-owner@gmail.com
   ```
   Si no existe, créalo.
3. Prueba: envíate un email a `info@tattoolowkey.com` y verifica que llega al Gmail del owner.

**Límite plan gratuito ImprovMX:** 500 emails/mes en total para todos los alias. Si se supera, el plan Premium cuesta ~$9/mes (ilimitado). Monitoriza en el dashboard de ImprovMX.

#### Parte B — Enviar / responder (Gmail "Enviar como")

1. El owner abre su **Gmail personal** → ⚙️ → **"Ver toda la configuración"**.
2. Pestaña **"Cuentas e importación"** → **"Enviar correo como"** → **"Añadir otra dirección"**.
3. Rellena:
   - **Nombre:** `Lowkey Tattoo`
   - **Dirección:** `info@tattoolowkey.com`
   - Desmarca "Tratar como alias" → Siguiente.
4. Datos SMTP de Brevo (mismos que usa Pablo):
   | Campo | Valor |
   |-------|-------|
   | Servidor SMTP | `smtp-relay.brevo.com` |
   | Puerto | `587` |
   | Usuario | Email de registro en Brevo |
   | Contraseña | Clave SMTP de Brevo |
   | Seguridad | TLS |
5. Clic en **"Añadir cuenta"** → Gmail envía código a `info@tattoolowkey.com` → llega al Gmail del owner vía ImprovMX → introduce el código.
6. (Opcional) Márcala como dirección predeterminada de respuesta.

---

### 2.3 Conectar EmailJS con el Gmail del owner

EmailJS envía los emails del artista usando el servicio `service_bkvljlx`. Verifica que apunta al Gmail correcto:

1. Ve a **[emailjs.com](https://emailjs.com)** → Dashboard → **Email Services**.
2. Entra en `service_bkvljlx` → comprueba que el **"From email"** es el Gmail del owner (con `pablo@tattoolowkey.com` configurado como alias).
3. Si no está conectado a la cuenta correcta → **"Add New Service"** → Gmail → conecta con el Gmail del owner → guarda el nuevo **Service ID** y actualiza `VITE_EMAILJS_SERVICE_ID` en `.env.local`.

---

### 2.4 Verificar entrega — lista de comprobación

- [ ] Email a `pablo@tattoolowkey.com` llega al Gmail de Pablo (ImprovMX alias activo)
- [ ] Pablo puede responder _desde_ `pablo@tattoolowkey.com` en Gmail (Brevo SMTP configurado)
- [ ] Email a `info@tattoolowkey.com` llega al Gmail del owner (ImprovMX alias activo)
- [ ] El owner puede responder _desde_ `info@tattoolowkey.com` en Gmail (Brevo SMTP configurado)
- [ ] EmailJS puede enviar (prueba desde el dashboard de EmailJS → "Test It")

---

## 3. Nuevos templates EmailJS

> Se necesitan **3 templates nuevos**. Todos usan el mismo Service ID (`service_bkvljlx`).
> Todos envían a **dos destinatarios**: el artista + el admin. EmailJS permite un solo `to_email` por envío, así que haremos **dos llamadas** por acción (una al artista, otra al admin), o bien usaremos el campo `reply_to` / CC. La opción más simple y fiable: **dos llamadas separadas**, cada una con su `to_email`.

### Template A — `template_calendar_event` (evento creado o cita nueva)

**Cuándo se usa:** Al crear un evento nuevo en el calendario admin (con o sin sesión vinculada).

En EmailJS → "Email Templates" → "Create New Template":

| Campo EmailJS | Valor |
|---|---|
| Template Name | `calendar_event_notification` |
| Subject | `{{action}} — {{event_title}} · {{event_date}}` |
| To email | `{{to_email}}` |
| From name | `Lowkey Tattoo` |
| Reply to | `info@tattoolowkey.com` |

Cuerpo (HTML recomendado):
```
<h2>{{action}}</h2>

<table>
  <tr><td><b>Artista</b></td><td>{{artist_name}}</td></tr>
  <tr><td><b>Cliente</b></td><td>{{client_name}}</td></tr>
  <tr><td><b>Servicio</b></td><td>{{session_type}}</td></tr>
  <tr><td><b>Fecha</b></td><td>{{event_date}}</td></tr>
  <tr><td><b>Hora</b></td><td>{{event_time}}</td></tr>
  <tr><td><b>Duración</b></td><td>{{duration}}</td></tr>
  <tr><td><b>Notas</b></td><td>{{notes}}</td></tr>
</table>

<p><a href="{{admin_url}}">Ver en el calendario →</a></p>
```

Variables que recibirá:
```
to_email      → dirección del destinatario (artista o admin)
action        → "Nueva cita en calendario" | "Sesión registrada" | "Cita confirmada"
event_title   → título del evento en Google Calendar
artist_name   → nombre del artista
client_name   → nombre del cliente (o "—" si no hay)
session_type  → "Tatuaje" | "Piercing" | "Láser" | "Retoque"
event_date    → "Martes, 22 de abril de 2026"
event_time    → "15:00 – 17:00"
duration      → "2 horas" (calculado de start/end)
notes         → descripción del evento / notas de sesión
admin_url     → URL al calendario admin
```

Guarda el **Template ID** → lo llamaremos `VITE_EMAILJS_CALENDAR_TEMPLATE_ID`.

---

### Template B — `template_calendar_update` (evento modificado)

**Cuándo se usa:** Al editar un evento existente (cambio de hora, fecha o título).

| Campo EmailJS | Valor |
|---|---|
| Template Name | `calendar_event_updated` |
| Subject | `Cita modificada — {{event_title}} · {{event_date}}` |
| To email | `{{to_email}}` |
| From name | `Lowkey Tattoo` |
| Reply to | `info@tattoolowkey.com` |

Cuerpo:
```
<h2>Una cita ha sido modificada</h2>

<h3>Datos anteriores</h3>
<table>
  <tr><td><b>Fecha anterior</b></td><td>{{old_date}}</td></tr>
  <tr><td><b>Hora anterior</b></td><td>{{old_time}}</td></tr>
</table>

<h3>Datos nuevos</h3>
<table>
  <tr><td><b>Artista</b></td><td>{{artist_name}}</td></tr>
  <tr><td><b>Cliente</b></td><td>{{client_name}}</td></tr>
  <tr><td><b>Fecha nueva</b></td><td>{{event_date}}</td></tr>
  <tr><td><b>Hora nueva</b></td><td>{{event_time}}</td></tr>
  <tr><td><b>Notas</b></td><td>{{notes}}</td></tr>
</table>

<p><a href="{{admin_url}}">Ver en el calendario →</a></p>
```

Variables adicionales:
```
old_date   → fecha anterior del evento
old_time   → hora anterior del evento
```

Guarda el **Template ID** → `VITE_EMAILJS_CALENDAR_UPDATE_TEMPLATE_ID`.

---

### Template C — `template_booking_confirmed` (reserva web → sesión confirmada)

**Cuándo se usa:** Cuando desde WebBookings se confirma una reserva y se crea cliente + sesión.

| Campo EmailJS | Valor |
|---|---|
| Template Name | `booking_confirmed_notification` |
| Subject | `Reserva confirmada — {{client_name}} · {{event_date}}` |
| To email | `{{to_email}}` |
| From name | `Lowkey Tattoo` |
| Reply to | `info@tattoolowkey.com` |

Cuerpo:
```
<h2>Reserva web confirmada y registrada</h2>

<table>
  <tr><td><b>Cliente</b></td><td>{{client_name}}</td></tr>
  <tr><td><b>Teléfono</b></td><td>{{client_phone}}</td></tr>
  <tr><td><b>Email cliente</b></td><td>{{client_email}}</td></tr>
  <tr><td><b>Artista</b></td><td>{{artist_name}}</td></tr>
  <tr><td><b>Servicio</b></td><td>{{session_type}}</td></tr>
  <tr><td><b>Fecha</b></td><td>{{event_date}}</td></tr>
  <tr><td><b>Hora</b></td><td>{{event_time}}</td></tr>
  <tr><td><b>Primera vez</b></td><td>{{is_first_time}}</td></tr>
  <tr><td><b>Descripción</b></td><td>{{notes}}</td></tr>
</table>

<p><a href="{{admin_url}}">Ver perfil del cliente →</a></p>
```

Guarda el **Template ID** → `VITE_EMAILJS_BOOKING_CONFIRMED_TEMPLATE_ID`.

---

## 4. Variables de entorno nuevas

### Estrategia de envío elegida (Opción A)

- **Artista** → EmailJS (ya configurado, mismos templates)
- **Admin** → **Brevo API** (ya tienes cuenta, 300 emails/día gratis, sin tocar el cupo de EmailJS de 200/mes)

Esto evita que las notificaciones de calendario agoten el plan gratuito de EmailJS. Cada acción envía 1 email vía EmailJS (artista) + 1 vía Brevo (admin).

### Obtener la Brevo API key

1. Dashboard de Brevo → esquina superior derecha → tu nombre → **SMTP & API**
2. Pestaña **API Keys** → "Generate a new API key"
3. Nombre: `lowkey-calendar-notifications`
4. Copia la key (solo se muestra una vez)

### Variables a añadir en `.env.local` y en Vercel

```bash
# ── EmailJS — templates nuevos (envío al artista) ─────────────────────────────
# Template A: evento creado / sesión registrada
VITE_EMAILJS_CALENDAR_TEMPLATE_ID=template_xxxxxxx

# Template B: evento modificado
VITE_EMAILJS_CALENDAR_UPDATE_TEMPLATE_ID=template_xxxxxxx

# Template C: reserva web confirmada
VITE_EMAILJS_BOOKING_CONFIRMED_TEMPLATE_ID=template_xxxxxxx

# ── Brevo API (envío al admin) ────────────────────────────────────────────────
# Brevo Dashboard → SMTP & API → API Keys → Generate
VITE_BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx

# Email del admin/owner — destinatario admin de todas las notificaciones
VITE_ADMIN_EMAIL=info@tattoolowkey.com
```

**En Vercel (producción):**
Dashboard → tu proyecto → Settings → Environment Variables → añade las 5 variables.

---

## 5. Color de eventos: identificar citas creadas desde la app

### Cómo funciona el color en Google Calendar API

Google Calendar permite asignar un `colorId` a cada evento individual. Son 11 colores predefinidos que se muestran sobre el color base del calendario:

| colorId | Nombre | Color |
|---------|--------|-------|
| `"1"`  | Lavender | Lavanda (azul claro) |
| `"2"`  | Sage | Verde salvia |
| `"3"`  | Grape | Morado |
| `"4"`  | Flamingo | Rosa |
| `"5"`  | Banana | Amarillo |
| `"6"`  | Tangerine | Naranja |
| `"7"`  | Peacock | Azul pavo real |
| `"8"`  | Graphite | Gris |
| `"9"`  | Blueberry | Azul marino |
| `"10"` | Basil | Verde oscuro |
| `"11"` | Tomato | Rojo |

**Convención elegida para este proyecto:**

| Origen del evento | colorId | Color | Significado |
|-------------------|---------|-------|-------------|
| Creado manualmente en Google Calendar | _(ninguno)_ | Color base del calendario | Cita manual / bloqueo |
| Creado desde la app (sesión registrada) | `"2"` | Verde salvia | Sesión confirmada en BD |
| Reserva web confirmada desde la app | `"7"` | Azul pavo real | Viene de reserva web |

> Se eligieron verde y azul porque son colores positivos/confirmados y contrastan bien con el color naranja/rojo que suele usar Google Calendar por defecto. Esto es fácilmente ajustable cambiando las constantes.

### Constantes a definir

**Archivo:** `src/shared/config/calendar.ts` _(archivo nuevo, muy pequeño)_

```typescript
/** colorId de Google Calendar para eventos creados desde la app */
export const CALENDAR_COLOR = {
  /** Sesión registrada manualmente desde el panel (SessionFromEventModal) */
  SESSION_FROM_EVENT: "2",   // Sage — verde salvia

  /** Reserva web confirmada y convertida en sesión (BookingToSessionModal) */
  SESSION_FROM_BOOKING: "7", // Peacock — azul pavo real
} as const;
```

### Dónde se aplica el color

#### Caso A — Crear evento nuevo CON sesión vinculada (`SessionFromEventModal`)

Al llamar a `useUpdateCalendarEvent` para actualizar el título del evento existente tras vincular la sesión, añadir `colorId`:

```typescript
await updateCalendarEvent.mutateAsync({
  calendarId: event.calendarId,
  eventId:    event.id,
  summary:    `${sessionData.type} — ${clientName}`,
  description: sessionData.notes ?? "",
  colorId:    CALENDAR_COLOR.SESSION_FROM_EVENT,   // ← añadir esto
});
```

#### Caso B — Crear evento nuevo desde `BookingToSessionModal`

Al llamar a `useCreateCalendarEvent`, añadir `colorId` al body:

```typescript
await createCalendarEvent.mutateAsync({
  calendarId:  artistCalendarId,
  summary:     `${sessionData.type} — ${clientName}`,
  description: sessionData.notes ?? "",
  start:       { dateTime: startIso, timeZone: "Atlantic/Canary" },
  end:         { dateTime: endIso,   timeZone: "Atlantic/Canary" },
  colorId:     CALENDAR_COLOR.SESSION_FROM_BOOKING,   // ← añadir esto
});
```

#### Caso C — Crear evento manual desde `Calendar.tsx` (sin sesión)

**No se añade `colorId`**. El evento tendrá el color por defecto del calendario, lo que diferencia visualmente las citas manuales de las registradas en BD.

### Compatibilidad con la Edge Function

La Edge Function actual hace `POST` con el body tal cual:

```typescript
// index.ts — ya existente
const { calendarId: _removed, ...safeEventBody } = eventBody;
// safeEventBody incluirá colorId si viene en el body
await googleCalendarFetch(`/calendars/.../events`, { method: "POST", body: JSON.stringify(safeEventBody) });
```

**`colorId` ya pasa automáticamente** porque el POST envía todo el `safeEventBody`. No hay que tocar el POST de la Edge Function para esto.

Para el **PATCH** (sección 6), el handler nuevo también debe incluir `colorId` como campo opcional:

```typescript
// En el handler PATCH de la Edge Function:
const { calendarId, eventId, summary, description, start, end, colorId } = await req.json();
// ...
const body: Record<string, unknown> = {};
if (summary)   body.summary   = summary;
if (description !== undefined) body.description = description;
if (start)     body.start     = { dateTime: start, timeZone: "Atlantic/Canary" };
if (end)       body.end       = { dateTime: end,   timeZone: "Atlantic/Canary" };
if (colorId)   body.colorId   = colorId;   // ← añadir
```

### Cómo se ve en Google Calendar

```
Calendario de Pablo:
  ┌──────────────────────────────────────┐
  │  [naranja] 10:00 Bloqueo almuerzo    │  ← manual, sin colorId
  │  [verde  ] 11:00 Tattoo — Juan G.    │  ← desde SessionFromEventModal
  │  [azul   ] 15:00 Tattoo — María L.   │  ← desde BookingToSessionModal
  │  [naranja] 17:00 Consulta            │  ← manual, sin colorId
  └──────────────────────────────────────┘
```

### Mostrar el color en la vista del calendario admin

El componente `Calendar.tsx` ya renderiza los eventos. Actualmente probablemente usa un color fijo. Hay que leer `event.colorId` y traducirlo a una clase Tailwind:

```typescript
// Helper a añadir en Calendar.tsx o en un utils
const GOOGLE_COLOR_MAP: Record<string, string> = {
  "1":  "bg-indigo-300",
  "2":  "bg-green-400",    // Sage — sesión desde app
  "3":  "bg-purple-400",
  "4":  "bg-pink-400",
  "5":  "bg-yellow-300",
  "6":  "bg-orange-400",
  "7":  "bg-blue-500",     // Peacock — sesión desde reserva web
  "8":  "bg-gray-400",
  "9":  "bg-blue-800",
  "10": "bg-green-700",
  "11": "bg-red-500",
};

function eventColorClass(colorId?: string): string {
  if (!colorId) return "bg-orange-400"; // color por defecto del calendario
  return GOOGLE_COLOR_MAP[colorId] ?? "bg-orange-400";
}
```

Usar `eventColorClass(event.colorId)` en el className del elemento del evento en la vista del calendario admin para que refleje el mismo color que Google Calendar.

### Leyenda visual en Calendar.tsx

Añadir una pequeña leyenda debajo del calendario admin para que los artistas entiendan el código de colores:

```tsx
<div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
  <span className="flex items-center gap-1.5">
    <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
    Cita manual
  </span>
  <span className="flex items-center gap-1.5">
    <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
    Sesión registrada (app)
  </span>
  <span className="flex items-center gap-1.5">
    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
    Reserva web confirmada
  </span>
</div>
```

---

## 6. Edge Function: soporte PATCH en Google Calendar

> ⚠️ Incluir `colorId` como campo opcional en el handler PATCH (ver sección 5).

**Archivo:** `supabase/functions/google-calendar/index.ts`

Actualmente soporta GET, POST y DELETE. Hay que añadir **PATCH** para poder actualizar un evento existente (título, descripción, fechas, color).

### Paso 6.1 — Actualizar el header CORS (obligatorio)

**Sin este cambio el navegador bloqueará la petición PATCH antes de llegar al handler.**

```typescript
// Línea 7 — cambiar esto:
"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",

// por esto:
"Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
```

### Paso 6.2 — Añadir el handler PATCH

Añadir justo antes del bloque `DELETE`, dentro del `try`:

```typescript
// ── PATCH — update existing event ────────────────────────────────────────────
if (req.method === "PATCH") {
  const { calendarId: patchCalendarId, eventId, summary, description, start, end, colorId } = await req.json();
  const targetCalendar = patchCalendarId || calendarId;

  if (!targetCalendar || !eventId) {
    return json({ error: "calendarId and eventId required" }, 400);
  }

  const body: Record<string, unknown> = {};
  if (summary !== undefined)     body.summary     = summary;
  if (description !== undefined) body.description = description;
  if (start)  body.start   = { dateTime: start, timeZone: "Atlantic/Canary" };
  if (end)    body.end     = { dateTime: end,   timeZone: "Atlantic/Canary" };
  if (colorId !== undefined) body.colorId = colorId;

  const res = await calApi(
    `/calendars/${encodeURIComponent(targetCalendar)}/events/${eventId}`,
    token,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  const data = await res.json();
  if (!res.ok) return json({ error: data }, res.status);
  return json(data);
}
```

> Usar el helper `calApi` ya existente (línea 65) mantiene la consistencia con el resto de métodos.

### Paso 6.3 — Deploy

```bash
npx supabase functions deploy google-calendar
```

---

## 7. Hook useUpdateCalendarEvent

> Añadir `colorId?: string` al tipo `UpdateCalendarEventParams` para poder pasarlo desde `SessionFromEventModal` y `EventActionPanel`.

**Archivo:** `src/admin/hooks/useGoogleCalendar.ts`

Añadir al final del archivo, junto a `useCreateCalendarEvent` y `useDeleteCalendarEvent`:

```typescript
interface UpdateCalendarEventParams {
  calendarId: string;
  eventId: string;
  summary?: string;
  description?: string;
  start?: string;   // ISO 8601
  end?: string;     // ISO 8601
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateCalendarEventParams) => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        method: "PATCH",
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalida la caché de eventos del calendario afectado
      queryClient.invalidateQueries({ queryKey: ["calendar-events", variables.calendarId] });
    },
  });
}
```

---

## 8. Capa de email: calendarEmail.ts

**Archivo nuevo:** `src/admin/lib/calendarEmail.ts`

Este módulo centraliza todos los envíos de email relacionados con el calendario. Usa **dos canales distintos** para no agotar el plan gratuito de EmailJS:

- **Artista** → EmailJS (cupo: 200/mes)
- **Admin** → Brevo API REST (cupo: 300/día — prácticamente ilimitado para este uso)

```typescript
import emailjs from "@emailjs/browser";
import { ARTISTS } from "@shared/config/artists";

// ── EmailJS (artista) ─────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const EMAILJS_TEMPLATES = {
  calendar:         import.meta.env.VITE_EMAILJS_CALENDAR_TEMPLATE_ID,
  calendarUpdate:   import.meta.env.VITE_EMAILJS_CALENDAR_UPDATE_TEMPLATE_ID,
  bookingConfirmed: import.meta.env.VITE_EMAILJS_BOOKING_CONFIRMED_TEMPLATE_ID,
} as const;

// ── Brevo API (admin) ─────────────────────────────────────────────────────────
const BREVO_API_KEY  = import.meta.env.VITE_BREVO_API_KEY;
const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL ?? "info@tattoolowkey.com";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type CalendarEmailAction =
  | "Nueva cita en calendario"
  | "Sesión registrada"
  | "Cita modificada"
  | "Reserva confirmada";

export interface CalendarEmailData {
  action: CalendarEmailAction;
  artistId: string;       // "pablo" | "sergio" | "fifo"
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  sessionType?: string;
  eventTitle: string;
  eventDate: string;      // Formato legible: "Martes, 22 de abril de 2026"
  eventTime: string;      // "15:00 – 17:00"
  duration?: string;
  notes?: string;
  oldDate?: string;       // Solo para "Cita modificada"
  oldTime?: string;       // Solo para "Cita modificada"
  isFirstTime?: boolean;  // Solo para reservas web
  adminUrl?: string;
}

/** Envía email al artista (EmailJS) Y al admin (Brevo). Falla silencioso. */
export async function sendCalendarEmail(data: CalendarEmailData): Promise<void> {
  const artist = ARTISTS.find((a) => a.id === data.artistId);
  if (!artist) {
    console.warn(`[calendarEmail] Artist not found: ${data.artistId}`);
    return;
  }

  const templateId =
    data.action === "Cita modificada"      ? EMAILJS_TEMPLATES.calendarUpdate
    : data.action === "Reserva confirmada" ? EMAILJS_TEMPLATES.bookingConfirmed
    : EMAILJS_TEMPLATES.calendar;

  const baseParams = {
    action:        data.action,
    event_title:   data.eventTitle,
    artist_name:   artist.name,
    client_name:   data.clientName  ?? "—",
    client_phone:  data.clientPhone ?? "—",
    client_email:  data.clientEmail ?? "—",
    session_type:  data.sessionType ?? "—",
    event_date:    data.eventDate,
    event_time:    data.eventTime,
    duration:      data.duration    ?? "—",
    notes:         data.notes       ?? "—",
    old_date:      data.oldDate     ?? "—",
    old_time:      data.oldTime     ?? "—",
    is_first_time: data.isFirstTime ? "Sí" : "No",
    admin_url:     data.adminUrl    ?? `${window.location.origin}/admin/calendar`,
  };

  // ── 1. Email al ARTISTA via EmailJS ──────────────────────────────────────────
  const sendToArtist = async () => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !templateId) {
      console.warn("[calendarEmail] EmailJS not configured — skipping artist email");
      return;
    }
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        templateId,
        { ...baseParams, to_email: artist.email },
        EMAILJS_PUBLIC_KEY,
      );
    } catch (err) {
      console.warn(`[calendarEmail] EmailJS to artist failed:`, err);
    }
  };

  // ── 2. Email al ADMIN via Brevo API ──────────────────────────────────────────
  const sendToAdmin = async () => {
    if (!BREVO_API_KEY) {
      console.warn("[calendarEmail] Brevo API key not configured — skipping admin email");
      return;
    }
    // Construir asunto y cuerpo en texto plano (Brevo acepta htmlContent también)
    const subject = `${data.action} — ${data.eventTitle} · ${data.eventDate}`;
    const textContent = [
      `Acción: ${data.action}`,
      `Artista: ${artist.name}`,
      `Cliente: ${baseParams.client_name}`,
      `Teléfono: ${baseParams.client_phone}`,
      `Servicio: ${baseParams.session_type}`,
      `Fecha: ${data.eventDate}`,
      `Hora: ${data.eventTime}`,
      `Duración: ${baseParams.duration}`,
      data.oldDate ? `Fecha anterior: ${data.oldDate} ${data.oldTime}` : "",
      `Notas: ${baseParams.notes}`,
      ``,
      `Ver en la app: ${baseParams.admin_url}`,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender:  { name: "Lowkey Tattoo App", email: "info@tattoolowkey.com" },
          to:      [{ email: ADMIN_EMAIL, name: "Admin Lowkey" }],
          subject,
          textContent,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn(`[calendarEmail] Brevo to admin failed: ${err}`);
      }
    } catch (err) {
      console.warn(`[calendarEmail] Brevo request failed:`, err);
    }
  };

  await Promise.allSettled([sendToArtist(), sendToAdmin()]);
}

// ── Helpers de formato ────────────────────────────────────────────────────────

/** Date → "martes, 22 de abril de 2026" */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

/** ISO start + end → "15:00 – 17:00" */
export function formatEventTime(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

/** ISO start + end → "2h 30min" */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
```

---

## 9. SessionFromEventModal

**Archivo nuevo:** `src/admin/components/SessionFromEventModal.tsx`

Modal de 3 pasos que aparece al pulsar "Registrar sesión" desde el `EventActionPanel`.

### Estructura del componente

```typescript
interface SessionFromEventModalProps {
  open: boolean;
  onClose: () => void;
  event: {
    id: string;           // Google Calendar event ID
    calendarId: string;
    title: string;
    start: string;        // ISO 8601
    end: string;          // ISO 8601
    artistId: string;     // "pablo" | "sergio" | "fifo"
    description?: string;
  };
}
```

### Paso 1 — Buscar o crear cliente (`ClientStep`)

- **Combobox** con búsqueda en tiempo real contra la tabla `clients`:
  - Usar **`useClientsPaged({ search, pageSize: 8 })`** (ya soporta búsqueda server-side por nombre, email y teléfono con `ilike`)
  - Debounce de 300ms sobre el input de búsqueda antes de disparar la query
  - Muestra: nombre + teléfono + artista principal
  - Al seleccionar uno existente → guarda `selectedClientId` → avanza al Paso 3
- **Botón "Crear nuevo cliente"** → muestra campos inline (ver Paso 2)
- No puede avanzar si no hay cliente seleccionado o formulario de nuevo cliente válido

### Paso 2 — Datos del cliente nuevo (`NewClientStep`, solo si se crea)

Formulario validado con Zod:
```typescript
const newClientSchema = z.object({
  name:     z.string().min(2, "Nombre requerido"),
  phone:    z.string().optional(),
  email:    z.string().email("Email inválido").optional().or(z.literal("")),
  notes:    z.string().optional(),
  allergies: z.string().optional(),
  primary_artist_id: z.string().optional(),   // preseleccionado con artistId del evento
});
```

### Paso 3 — Datos de la sesión (`SessionStep`)

Pre-rellena desde el evento:
- `date` → extraído de `event.start` (bloqueado, no editable)
- `artist_id` → del evento (bloqueado, solo visual)
- `duration_minutes` → calculado de `event.start` / `event.end`
- `notes` → `event.description`

Campos editables:
```typescript
const sessionSchema = z.object({
  type:             z.enum(["tattoo", "piercing", "laser", "retoque"]),
  price:            z.number().min(0).optional(),
  deposit:          z.number().min(0).default(0),
  paid:             z.boolean().default(false),
  body_zone:        z.string().optional(),
  style:            z.string().optional(),
  notes:            z.string().optional(),
  duration_minutes: z.number().optional(),
});
```

### Lógica de submit

```typescript
async function handleSubmit() {
  // 1. Crear cliente si es nuevo
  let clientId = selectedClientId;
  if (!clientId) {
    const newClient = await createClient.mutateAsync({
      ...newClientData,
      primary_artist_id: resolvedArtistProfileId, // profile.id del artista
    });
    clientId = newClient.id;
  }

  // 2. Crear sesión
  const session = await createSession.mutateAsync({
    client_id:        clientId,
    artist_id:        resolvedArtistProfileId,
    date:             event.start.split("T")[0],
    type:             sessionData.type,
    price:            sessionData.price ?? null,
    deposit:          sessionData.deposit,
    paid:             sessionData.paid,
    body_zone:        sessionData.body_zone ?? null,
    style:            sessionData.style ?? null,
    notes:            sessionData.notes ?? null,
    duration_minutes: sessionData.duration_minutes ?? null,
  });

  // 3. Actualizar título del evento en Google Calendar
  await updateCalendarEvent.mutateAsync({
    calendarId: event.calendarId,
    eventId:    event.id,
    summary:    `${sessionData.type} — ${clientName}`,
    description: sessionData.notes ?? event.description,
  });

  // 4. Enviar email al artista + admin
  await sendCalendarEmail({
    action:      "Sesión registrada",
    artistId:    event.artistId,
    clientName,
    sessionType: sessionData.type,
    eventTitle:  `${sessionData.type} — ${clientName}`,
    eventDate:   formatEventDate(new Date(event.start)),
    eventTime:   formatEventTime(event.start, event.end),
    duration:    formatDuration(event.start, event.end),
    notes:       sessionData.notes,
    adminUrl:    `${window.location.origin}/admin/clients/${clientId}`,
  });

  // 5. Toast + navegar al perfil
  toast.success(`Sesión registrada para ${clientName}`);
  navigate(`/admin/clients/${clientId}`);
  onClose();
}
```

### Resolución de artista: `_calendarId` → `profile.id`

Este es el paso crítico que conecta el evento de Google Calendar con la sesión en Supabase. La cadena completa:

```typescript
// event._calendarId = "lowkeytattootenerife@gmail.com" (ID de Google Calendar)
// artistProfiles = resultado de useArtistProfiles()

const artistProfile = artistProfiles.find(
  (p) => p.calendar_id === event._calendarId
);

// artistProfile.artist_config_id = "pablo"  ← para sendCalendarEmail()
// artistProfile.id                = UUID     ← para sessions.artist_id

if (!artistProfile) {
  toast.error("No se puede vincular el evento a un artista. Verifica que el artista tiene Calendar ID configurado en Admin → Artistas.");
  return;
}

const resolvedArtistConfigId = artistProfile.artist_config_id ?? "";  // "pablo"
const resolvedArtistProfileId = artistProfile.id;                      // UUID
```

Si `artistProfile` es `null` (el `calendar_id` del evento no coincide con ningún perfil), mostrar un toast de error y no continuar. Esto ocurre solo si un artista no tiene su Calendar ID configurado en Admin → Artistas.

### Añadir colorId al actualizar el evento

En el submit, paso 3 (actualizar Google Calendar), incluir el color:

```typescript
await updateCalendarEvent.mutateAsync({
  calendarId: event._calendarId,
  eventId:    event.id,
  summary:    `${sessionData.type} — ${clientName}`,
  description: sessionData.notes ?? event.description,
  colorId:    CALENDAR_COLOR.SESSION_FROM_EVENT,   // "2" — verde salvia
});
```

### Notas de implementación

- Usar `useArtistProfiles()` para la resolución `_calendarId` → `profile.id` descrita arriba.
- El componente usa `AnimatePresence` + `motion.div` para la transición entre pasos (ya hay precedente en `BookingModal.tsx`).
- Import de `useUpdateCalendarEvent` del hook creado en la sección 7.
- Import de `sendCalendarEmail`, `formatEventDate`, `formatEventTime`, `formatDuration` de `calendarEmail.ts`.
- Import de `CALENDAR_COLOR` de `src/shared/config/calendar.ts`.

---

## 10. EventActionPanel + Calendar.tsx

### 10.1 EventActionPanel

**Archivo nuevo:** `src/admin/components/EventActionPanel.tsx`

Panel lateral (sheet/drawer) que aparece al clicar un evento en el calendario.

```typescript
interface EventActionPanelProps {
  event: CalendarEvent | null;   // null = cerrado
  artistId: string;
  onClose: () => void;
  onEventUpdated: () => void;    // para refrescar la vista del calendario
}
```

**Contenido del panel:**

```
┌─────────────────────────────────┐
│  ✕                              │
│                                 │
│  [Título del evento]            │
│  Artista: Pablo Matos           │
│                                 │
│  📅 Martes, 22 de abril         │
│  🕒 15:00 – 17:00 (2h)          │
│                                 │
│  [Descripción / notas]          │
│                                 │
│  ┌──────────────────────────┐   │
│  │   + Registrar sesión     │   │  → abre SessionFromEventModal
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   ✏️  Editar evento       │   │  → abre EventEditModal (inline)
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   🗑  Eliminar evento     │   │  → confirma + deleteCalendarEvent
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Comportamiento de "Editar evento":**

Abre un formulario inline en el mismo panel (sin modal adicional):
- Campos: título, fecha inicio, fecha fin, descripción
- Al guardar: `useUpdateCalendarEvent()` + `sendCalendarEmail({ action: "Cita modificada", oldDate, oldTime, ... })`

**Comportamiento de "Eliminar evento":**
- Diálogo de confirmación: "¿Seguro que quieres eliminar esta cita?"
- Llama a `useDeleteCalendarEvent()` existente
- **No envía email** al eliminar (decisión de diseño: evitar notificaciones de borrado innecesarias — ajustable si se prefiere)

### 10.2 Modificaciones en Calendar.tsx

1. **Importar** `EventActionPanel` y `SessionFromEventModal`.
2. **Añadir estado:**
   ```typescript
   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
   const [sessionModalOpen, setSessionModalOpen] = useState(false);
   ```
3. **Al clicar un evento** en el grid del calendario → `setSelectedEvent(event)` en lugar del comportamiento actual.
4. **Añadir `EventActionPanel`** al final del JSX:
   ```tsx
   <EventActionPanel
     event={selectedEvent}
     artistId={currentArtistId}
     onClose={() => setSelectedEvent(null)}
     onEventUpdated={() => {
       queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
       setSelectedEvent(null);
     }}
   />
   ```
5. **Al crear un evento nuevo** (botón/formulario existente) → después de `useCreateCalendarEvent` → llamar `sendCalendarEmail({ action: "Nueva cita en calendario", ... })`.

> **Nota:** El componente `EventCard` ya existe en `Calendar.tsx` (línea ~55) con un botón de eliminar. El `EventActionPanel` lo reemplaza, incorporando ese botón de borrado y añadiendo "Registrar sesión" y "Editar". No hay que crear la UI de borrado desde cero.

> **Bug pre-existente (no bloqueante):** `useDeleteCalendarEvent` en `Calendar.tsx` usa siempre el `calendarId` del usuario logado. El owner puede ver eventos de otros artistas pero al borrar siempre apunta a su propio calendario. Al integrar el `EventActionPanel`, pasar el `_calendarId` del evento al hook de borrado para solucionarlo de paso.

---

## 11. BookingToSessionModal + WebBookings.tsx

### 11.1 BookingToSessionModal

**Archivo nuevo:** `src/admin/components/BookingToSessionModal.tsx`

Modal que abre al pulsar "Confirmar y registrar" en una reserva web pendiente.

```typescript
interface BookingToSessionModalProps {
  open: boolean;
  onClose: () => void;
  booking: WebBooking;   // tipo existente en @shared/types
}
```

**Pre-relleno desde la reserva web:**

| Campo del modal | Fuente en WebBooking |
|---|---|
| Nombre cliente | `booking.client_name` |
| Teléfono | `booking.client_phone` |
| Email | `booking.client_email` |
| Artista | `booking.artist_config_id` |
| Tipo servicio | `booking.service_type` |
| Fecha preferida | `booking.preferred_date` |
| Hora preferida | `booking.preferred_time` |
| Descripción | `booking.description` |
| Primera vez | `booking.is_first_time` |

**Flujo de 2 pasos:**

**Paso 1 — Verificar cliente**
- Busca automáticamente en `clients` por teléfono o email al abrir
- Si encuentra coincidencia → muestra el cliente encontrado con opción de confirmar o crear uno nuevo
- Si no encuentra → muestra formulario pre-relleno para crear cliente nuevo

**Paso 2 — Confirmar sesión + fecha/hora definitivas**
- Los campos de fecha/hora son editables (la fecha preferida de la reserva puede diferir de la definitiva)
- Mismos campos que `SessionStep` del modal anterior
- Adicionalmente: selector de hora de inicio + duración (en minutos) para calcular hora de fin

**Submit:**
```typescript
async function handleSubmit() {
  // 1. Crear o reusar cliente
  let clientId = existingClientId;
  if (!clientId) {
    const client = await createClient.mutateAsync(clientData);
    clientId = client.id;
  }

  // 2. Crear sesión
  await createSession.mutateAsync({ client_id: clientId, ...sessionData });

  // 3. Crear evento en Google Calendar
  // Reutilizar buildBookingEvent() de useGoogleCalendar.ts para construir el objeto
  const startIso = `${sessionData.date}T${startTime}:00`;
  const endIso   = addMinutes(startIso, sessionData.duration_minutes ?? 60);
  const calEvent = {
    ...buildBookingEvent({
      clientName,
      serviceLabel: sessionData.type,
      date:         sessionData.date,
      time:         startTime,
      notes:        sessionData.notes ?? booking.description ?? null,
      bodyZone:     sessionData.body_zone ?? null,
      phone:        clientData.phone ?? null,
    }),
    colorId: CALENDAR_COLOR.SESSION_FROM_BOOKING,   // "7" — azul pavo real
    calendarId: artistCalendarId,
  };
  await createCalendarEvent.mutateAsync(calEvent);

  // 4. Marcar reserva como confirmada
  await supabase
    .from("web_bookings")
    .update({ status: "confirmed" })
    .eq("id", booking.id);

  // 5. Enviar email
  await sendCalendarEmail({
    action:      "Reserva confirmada",
    artistId:    booking.artist_config_id ?? "",
    clientName,
    clientPhone: clientData.phone,
    clientEmail: clientData.email,
    sessionType: sessionData.type,
    eventTitle:  `${sessionData.type} — ${clientName}`,
    eventDate:   formatEventDate(new Date(sessionData.date)),
    eventTime:   formatEventTime(startIso, endIso),
    duration:    formatDuration(startIso, endIso),
    notes:       sessionData.notes,
    isFirstTime: booking.is_first_time,
    adminUrl:    `${window.location.origin}/admin/clients/${clientId}`,
  });

  // 6. Invalidar caché
  queryClient.invalidateQueries({ queryKey: ["web-bookings"] });
  queryClient.invalidateQueries({ queryKey: ["sessions"] });

  toast.success(`Reserva confirmada y sesión registrada para ${clientName}`);
  navigate(`/admin/clients/${clientId}`);
  onClose();
}
```

### 11.2 Modificaciones en WebBookings.tsx

1. **Importar** `BookingToSessionModal`.
2. **Añadir estado:**
   ```typescript
   const [registerBooking, setRegisterBooking] = useState<WebBooking | null>(null);
   ```
3. **Añadir botón** en cada fila de reserva pendiente:
   ```tsx
   <button
     onClick={() => setRegisterBooking(booking)}
     className="..."  // estilo secundario, junto a los botones de WhatsApp/Gmail existentes
   >
     Confirmar y registrar
   </button>
   ```
4. **Añadir modal** al final del JSX:
   ```tsx
   <BookingToSessionModal
     open={!!registerBooking}
     booking={registerBooking!}
     onClose={() => setRegisterBooking(null)}
   />
   ```

---

## 12. Envío de email al crear/modificar evento (sin sesión)

Estos son los dos casos más simples: el usuario solo crea o edita un evento en Google Calendar sin vincular sesión.

### 11.1 Crear evento (Calendar.tsx)

Localiza en `Calendar.tsx` donde se llama a `useCreateCalendarEvent()` (en el `onSuccess` o justo después del `mutate`). Añadir:

```typescript
await sendCalendarEmail({
  action:     "Nueva cita en calendario",
  artistId:   currentArtistId,
  clientName: extractClientFromTitle(newEventTitle), // helper que parsea "Tattoo — Juan García"
  eventTitle: newEventTitle,
  eventDate:  formatEventDate(new Date(startDate)),
  eventTime:  formatEventTime(startIso, endIso),
  duration:   formatDuration(startIso, endIso),
  notes:      newEventDescription,
});
```

Helper `extractClientFromTitle`:
```typescript
// "Tatuaje — Juan García" → "Juan García" | "—"
function extractClientFromTitle(title: string): string {
  const parts = title.split("—");
  return parts.length > 1 ? parts[1].trim() : "—";
}
```

### 11.2 Editar evento (EventActionPanel)

Ya cubierto en la sección 9.1. Al guardar el formulario de edición inline:

```typescript
// Guardar fecha/hora anterior antes de llamar al update
const oldDate = formatEventDate(new Date(event.start));
const oldTime = formatEventTime(event.start, event.end);

await updateCalendarEvent.mutateAsync({ ... });

await sendCalendarEmail({
  action:   "Cita modificada",
  artistId: artistId,
  oldDate,
  oldTime,
  eventDate: formatEventDate(new Date(newStart)),
  eventTime: formatEventTime(newStart, newEnd),
  ...
});
```

---

## 13. Pruebas end-to-end

### 12.1 Lista de comprobación — emails

- [ ] **Recepción en `info@tattoolowkey.com`:** enviar un email de prueba desde otra cuenta y verificar que llega al Gmail del owner
- [ ] **Recepción en artista:** enviar a `pablo@tattoolowkey.com` y verificar que llega a su Gmail personal
- [ ] **Envío desde `info@tattoolowkey.com`:** responder desde Gmail del owner con la dirección corporativa y verificar que el remitente es correcto
- [ ] **EmailJS test:** desde el dashboard de EmailJS → test de cada template nuevo con variables de ejemplo
- [ ] **ImprovMX límite:** revisar el dashboard de ImprovMX tras una semana de uso para asegurarse de que no se acerca al límite de 500/mes del plan gratuito

### 12.2 Lista de comprobación — flujo Entrada A (Calendario → Sesión nueva)

- [ ] Clicar un evento abre `EventActionPanel`
- [ ] "Registrar sesión" abre `SessionFromEventModal` con datos pre-rellenos
- [ ] Búsqueda de cliente existente devuelve resultados correctos
- [ ] Crear cliente nuevo → aparece en la tabla `clients` de Supabase
- [ ] Crear sesión → aparece en `sessions` con `client_id` correcto
- [ ] Evento de Google Calendar se actualiza con el nombre del cliente
- [ ] Email llega al artista con datos correctos
- [ ] Email llega al admin (`info@tattoolowkey.com`) con datos correctos
- [ ] Toast de éxito + redirección al perfil del cliente

### 12.3 Lista de comprobación — flujo Entrada B (Crear evento nuevo)

- [ ] Crear evento en calendario → email al artista + admin con `action: "Nueva cita en calendario"`
- [ ] El evento aparece en Google Calendar correctamente

### 12.4 Lista de comprobación — flujo Entrada C (Editar evento)

- [ ] Editar título/fecha en `EventActionPanel` → `useUpdateCalendarEvent` hace PATCH a Google Calendar
- [ ] Email al artista + admin con `action: "Cita modificada"` y fechas antigua/nueva

### 12.5 Lista de comprobación — flujo Entrada D (Reserva web → sesión)

- [ ] Botón "Confirmar y registrar" aparece en reservas con estado `pending`
- [ ] `BookingToSessionModal` abre con datos pre-rellenos de la reserva
- [ ] Búsqueda automática por teléfono/email encuentra cliente existente si ya estaba
- [ ] Submit crea cliente (si nuevo) + sesión + evento en Google Calendar
- [ ] `web_bookings.status` cambia a `"confirmed"` en Supabase
- [ ] Email al artista + admin con `action: "Reserva confirmada"`
- [ ] La reserva ya no aparece en el listado de pendientes

---

## 14. Orden de implementación resumido

| # | Tarea | Archivo(s) | Dependencias |
|---|-------|-----------|--------------|
| 1 | Verificar ImprovMX + configurar "Enviar como" en Gmail del owner | — (configuración externa) | Ninguna |
| 2 | Crear 3 templates en EmailJS | — (configuración externa) | Service ID funcional |
| 3 | Obtener Brevo API key (Admin → SMTP & API → API Keys) | — (configuración externa) | Cuenta Brevo activa |
| 4 | Añadir variables de entorno (5 vars) | `.env.local` + Vercel Settings | Pasos 2 y 3 |
| 5 | Constantes de color | `src/shared/config/calendar.ts` | Ninguna |
| 6 | CORS header + handler PATCH + `colorId` en Edge Function | `supabase/functions/google-calendar/index.ts` | Ninguna |
| 7 | `useUpdateCalendarEvent` (con `colorId`) | `src/admin/hooks/useGoogleCalendar.ts` | Paso 6 |
| 8 | `calendarEmail.ts` (EmailJS artista + Brevo admin) | `src/admin/lib/calendarEmail.ts` | Pasos 4 y 5 |
| 9 | `SessionFromEventModal` | `src/admin/components/SessionFromEventModal.tsx` | Pasos 5, 7 y 8 |
| 10 | `EventActionPanel` | `src/admin/components/EventActionPanel.tsx` | Pasos 7, 8 y 9 |
| 11 | Integrar en `Calendar.tsx` + fix bug delete + leyenda de colores | `src/admin/pages/Calendar.tsx` | Pasos 5, 8, 9 y 10 |
| 12 | `BookingToSessionModal` | `src/admin/components/BookingToSessionModal.tsx` | Pasos 5, 7 y 8 |
| 13 | Integrar en `WebBookings.tsx` | `src/admin/pages/WebBookings.tsx` | Paso 12 |
| 14 | Pruebas end-to-end | — | Todo lo anterior |

> Los pasos 1–4 son configuración externa (sin código). Se puede empezar con los pasos de código (5–13) en paralelo, ya que `calendarEmail.ts` falla silenciosamente si las variables de entorno no están configuradas — no bloquea el desarrollo.
