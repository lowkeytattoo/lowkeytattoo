# Guía de configuración: Google Analytics 4 + Meta Pixel
**Lowkey Tattoo — tattoolowkey.com**  
**Fecha:** Abril 2026

> Todo el código ya está escrito y listo. Solo necesitas seguir estos pasos para activar las IDs reales.
> El sistema cumple con RGPD: ningún dato se envía hasta que el usuario acepte las cookies.

---

## Cómo funciona el sistema (antes de empezar)

```
Usuario visita la web
        │
        ▼
Cookie banner aparece (consentimiento "pending")
        │
   ┌────┴────┐
Acepta     Rechaza
   │           │
   ▼           ▼
GA4 + Pixel  No se carga nada
se inicializan
```

- **Google Consent Mode v2** está configurado en `index.html` — por defecto todo está **denegado**.
- `analytics.ts` inicializa GA4 y el Pixel solo después de `grantConsent()`.
- Si el usuario ya aceptó antes, se restaura automáticamente al volver.
- **Dos variables de entorno** controlan todo: `VITE_GA4_MEASUREMENT_ID` y `VITE_META_PIXEL_ID`.

---

---

# PARTE 1 — GOOGLE ANALYTICS 4

---

## Paso 1 · Crear cuenta de Google Analytics

1. Ve a **[analytics.google.com](https://analytics.google.com)** con tu cuenta de Google.
2. Si es la primera vez, haz clic en **"Comenzar a medir"**.
3. En "Nombre de cuenta" escribe: `Lowkey Tattoo`
4. En "Configuración de uso compartido de datos" puedes dejar las opciones por defecto.
5. Haz clic en **Siguiente**.

---

## Paso 2 · Crear una propiedad GA4

1. En "Nombre de la propiedad" escribe: `tattoolowkey.com`
2. En "Zona horaria de informes" selecciona: **España (UTC+1)**
3. En "Moneda" selecciona: **Euro (€)**
4. Haz clic en **Siguiente**.
5. En "Categoría del sector" selecciona: **Arte y entretenimiento** (la más cercana)
6. En "Tamaño de empresa" selecciona: **Pequeña (1-10 empleados)**
7. En "Cómo piensas usar Analytics" marca: **Analizar el comportamiento de clientes**
8. Haz clic en **Crear**. Acepta los términos de servicio.

---

## Paso 3 · Configurar un flujo de datos web

1. En la pantalla "Recopilación de datos", selecciona **Web**.
2. En "URL del sitio web" escribe: `https://tattoolowkey.com`
3. En "Nombre del flujo" escribe: `Lowkey Tattoo Web`
4. Deja **Medición mejorada activada** (esto rastrea clics, scroll, descargas automáticamente).
5. Haz clic en **Crear flujo**.

---

## Paso 4 · Copiar el Measurement ID

1. Verás una pantalla con los detalles del flujo.
2. Busca el campo **"ID de medición"** — tiene este formato: `G-XXXXXXXXXX`
3. **Cópialo**. Lo necesitarás en el siguiente paso.

> Ejemplo: `G-A1B2C3D4E5`

---

## Paso 5 · Añadir la variable al proyecto local

Abre el archivo **`.env.local`** en la raíz del proyecto y añade (o actualiza) esta línea:

```env
VITE_GA4_MEASUREMENT_ID=G-TWXC2L3LQJ
```

Sustituye `G-XXXXXXXXXX` por tu ID real. Ejemplo:
```env
VITE_GA4_MEASUREMENT_ID=G-A1B2C3D4E5
```

Guarda el archivo. **No subas este archivo a Git** (ya está en `.gitignore`).

---

## Paso 6 · Añadir la variable en Vercel (producción)

Esto es **imprescindible** — sin este paso GA4 no funcionará en la web publicada.

1. Ve a **[vercel.com](https://vercel.com)** → entra en tu proyecto `lowkey-tattoo` (o como se llame).
2. Haz clic en la pestaña **Settings**.
3. En el menú izquierdo haz clic en **Environment Variables**.
4. Haz clic en **Add New**.
5. Rellena:
   - **Key:** `VITE_GA4_MEASUREMENT_ID`
   - **Value:** `G-XXXXXXXXXX` (tu ID real)
   - **Environments:** marca las tres: ✅ Production, ✅ Preview, ✅ Development
6. Haz clic en **Save**.
7. **Importante:** Ve a la pestaña **Deployments**, busca el último deployment y haz clic en los tres puntos `···` → **Redeploy** para que la variable surta efecto.

---

## Paso 7 · Verificar que GA4 funciona

### En local:
1. Ejecuta `npm run dev` en el terminal.
2. Abre la web en el navegador, **acepta las cookies** en el banner.
3. Abre DevTools (F12) → pestaña **Network**.
4. Filtra por `collect` o `gtag`.
5. Deberías ver peticiones a `https://www.google-analytics.com/g/collect?...`

### En producción:
1. Ve a **analytics.google.com** → tu propiedad → **Informes** → **Tiempo real**.
2. Abre **tattoolowkey.com** en otra pestaña, acepta cookies.
3. En Google Analytics verás "1 usuario en los últimos 30 minutos".

### Con la extensión (recomendado):
1. Instala **[Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)** en Chrome.
2. Actívala, visita la web, acepta cookies.
3. Abre la consola del navegador — verás los eventos enviados en tiempo real con todos sus parámetros.

---

## Paso 8 · Configurar conversiones en GA4

Los eventos ya están siendo enviados desde el código. Solo tienes que marcarlos como **conversiones** en GA4 para que aparezcan en los informes de conversión:

1. En GA4 ve a **Configurar** (icono de engranaje, abajo izquierda) → **Eventos**.
2. Espera 24-48h a que aparezcan los primeros eventos (o pruébalos tú mismo).
3. Cuando aparezca `booking_submit`, haz clic en el toggle de la columna **"Marcar como conversión"**.
4. Repite para `cta_click`.

**Eventos que ya envía tu web automáticamente:**

| Evento | Cuándo se dispara |
|---|---|
| `booking_submit` | Usuario completa y envía el formulario de reserva ⭐ |
| `cta_click` | Click en botón "Reservar cita" (navbar, hero, menú móvil) |
| `booking_open` | Se abre el modal de reserva |
| `booking_step_complete` | Completa un paso del formulario (1, 2 o 3) |
| `category_select` | Click en categoría (tatuaje, piercing, láser) |
| `artist_view` | Visualiza la ficha de un artista |
| `ig_click` | Click en enlace de Instagram |
| `page_view` | Automático en cada navegación (SPA) |

---

## Paso 9 · Vincular GA4 con Google Search Console

Esto te permite ver en Analytics qué búsquedas de Google traen tráfico.

1. En GA4 → **Configurar** → **Vínculos de productos** → **Search Console**.
2. Haz clic en **Vincular**.
3. Selecciona tu propiedad de Search Console `tattoolowkey.com`.
4. Haz clic en **Siguiente** → **Enviar**.

> Si aún no tienes Search Console configurado, primero ve a [search.google.com/search-console](https://search.google.com/search-console) y verifica el dominio.

---

---

# PARTE 2 — META PIXEL

---

## Paso 1 · Crear o acceder a Meta Business Suite

1. Ve a **[business.facebook.com](https://business.facebook.com)**.
2. Si no tienes una cuenta Business, haz clic en **"Crear cuenta"** y sigue los pasos con tu cuenta personal de Facebook.
3. Nombre del negocio: `Lowkey Tattoo`
4. Tu nombre y correo de trabajo.

---

## Paso 2 · Acceder al Administrador de Eventos

1. En el menú de la izquierda de Meta Business Suite, haz clic en el icono de cuadrícula (todas las herramientas).
2. Busca y haz clic en **"Administrador de eventos"** (Events Manager).
3. También puedes ir directamente: **[business.facebook.com/events_manager2](https://business.facebook.com/events_manager2)**

---

## Paso 3 · Crear el Pixel

1. En el Administrador de Eventos haz clic en **"Conectar orígenes de datos"** (o el botón `+`).
2. Selecciona **"Web"**.
3. Selecciona **"Meta Pixel"** y haz clic en **Conectar**.
4. En "Nombre del Pixel" escribe: `Lowkey Tattoo Pixel`
5. En "URL del sitio web" escribe: `https://tattoolowkey.com`
6. Haz clic en **Continuar**.

---

## Paso 4 · Elegir método de instalación

1. Cuando te pregunten cómo instalar el Pixel, selecciona **"Instalar código manualmente"**.
   > (El código ya está en tu proyecto, solo necesitas el ID.)
2. Verás el código del Pixel con tu **Pixel ID** — un número de 15-16 dígitos, por ejemplo: `1234567890123456`
3. **Copia este número**. No copies todo el código, solo el ID numérico.

---

## Paso 5 · Añadir la variable al proyecto local

Abre **`.env.local`** y añade:

```env
VITE_META_PIXEL_ID=1234567890123456
```

Sustituye por tu ID real.

---

## Paso 6 · Actualizar el fallback noscript en index.html

Hay una línea en `index.html` con `PIXEL_ID_PLACEHOLDER` para usuarios sin JavaScript. Cámbiala manualmente:

Abre `index.html`, busca esta línea (alrededor de la línea 224):

```html
src="https://www.facebook.com/tr?id=PIXEL_ID_PLACEHOLDER&ev=PageView&noscript=1"
```

Y sustitúyela por tu ID real:

```html
src="https://www.facebook.com/tr?id=1234567890123456&ev=PageView&noscript=1"
```

---

## Paso 7 · Añadir la variable en Vercel (producción)

Igual que con GA4:

1. Ve a **Vercel** → tu proyecto → **Settings** → **Environment Variables**.
2. Haz clic en **Add New**.
3. Rellena:
   - **Key:** `VITE_META_PIXEL_ID`
   - **Value:** `1234567890123456` (tu ID real)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Haz clic en **Save**.
5. Ve a **Deployments** → último deployment → `···` → **Redeploy**.

---

## Paso 8 · Verificar que el Pixel funciona

### Con Meta Pixel Helper (Chrome):
1. Instala la extensión **[Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)** en Chrome.
2. Visita **tattoolowkey.com**, acepta las cookies.
3. Haz clic en el icono de la extensión en la barra del navegador.
4. Deberías ver:
   - ✅ `PageView` — se dispara al cargar la página
5. Interactúa con la web (haz clic en "Reservar cita") y verás:
   - ✅ `Contact` — al hacer clic en el botón de reserva
6. Completa una reserva de prueba y verás:
   - ✅ `Lead` — al enviar el formulario de reserva

### En el Administrador de Eventos de Meta:
1. Ve al **Administrador de Eventos** → tu Pixel → **Actividad de eventos**.
2. En las próximas horas verás los eventos llegando.
3. La columna "Actividad reciente" debería mostrar actividad.

---

## Paso 9 · Configurar audiencias (opcional pero recomendado)

Una vez el Pixel está activo, crea estas audiencias en Meta para futuras campañas:

1. Ve a **Administrador de Anuncios** → **Audiencias**.
2. Haz clic en **"Crear audiencia"** → **"Audiencia personalizada"** → **"Sitio web"**.
3. Crea estas audiencias:

| Nombre | Condición | Ventana |
|---|---|---|
| `Visitantes web 30d` | Todos los visitantes | 30 días |
| `Visitantes web 90d` | Todos los visitantes | 90 días |
| `Interesados en reservar` | Evento `Contact` (click en CTA) | 60 días |
| `Leads calientes` | Evento `Lead` (formulario enviado) | 180 días |

---

---

# PARTE 3 — VERIFICACIÓN FINAL

---

## Checklist completo antes de publicar

```
GOOGLE ANALYTICS 4
□ VITE_GA4_MEASUREMENT_ID añadida en .env.local
□ VITE_GA4_MEASUREMENT_ID añadida en Vercel → Environment Variables
□ Redeploy realizado en Vercel
□ Informe en tiempo real muestra visitas al aceptar cookies
□ Extensión GA Debugger confirma envío de eventos
□ booking_submit marcado como conversión en GA4
□ cta_click marcado como conversión en GA4
□ Vinculado con Google Search Console

META PIXEL
□ VITE_META_PIXEL_ID añadida en .env.local
□ PIXEL_ID_PLACEHOLDER reemplazado en index.html
□ VITE_META_PIXEL_ID añadida en Vercel → Environment Variables
□ Redeploy realizado en Vercel
□ Meta Pixel Helper confirma PageView al aceptar cookies
□ Meta Pixel Helper confirma Contact al clicar CTA
□ Meta Pixel Helper confirma Lead al enviar reserva
□ Audiencias creadas en Meta (Visitantes 30d, Interesados, Leads)
```

---

## Errores comunes y soluciones

### GA4 no registra visitas
- **Causa más frecuente:** No se hizo Redeploy en Vercel tras añadir la variable.
- **Solución:** Vercel → Deployments → Redeploy.
- **Comprueba también:** En el banner de cookies, ¿estás haciendo clic en "Aceptar"? Sin consentimiento no se envía nada.

### El Pixel no aparece en Pixel Helper
- **Causa más frecuente:** `VITE_META_PIXEL_ID` no está bien escrita en `.env.local` (el nombre debe ser exacto, incluyendo mayúsculas).
- **Solución:** Para el servidor con `Ctrl+C`, vuelve a ejecutar `npm run dev` para recargar las variables de entorno.

### Los eventos se duplican
- **Causa:** Tienes instalado Google Tag Manager Y el código directo. En este proyecto solo hay código directo, así que no debería pasar.
- **Solución:** No añadas GTM si ya tienes el código en `analytics.ts`.

### "Consent mode not detected" en GA4
- **Causa:** Esto es solo un aviso en versiones muy nuevas de GA4 si no detectan el modo de consentimiento en los primeros milisegundos.
- **Estado:** No aplica — el bloque de Consent Mode v2 en `index.html` ya está correcto y se ejecuta antes que cualquier script.

---

## Variables de entorno — Resumen

Estas son **todas** las variables de entorno relacionadas con analytics. El archivo `.env.local` completo debería incluir:

```env
# Supabase (ya configurado)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-TWXC2L3LQJ

# Meta / Facebook Pixel
VITE_META_PIXEL_ID=1234567890123456

# Google Ads (opcional — solo si haces campañas de Google Ads)
# VITE_GOOGLE_ADS_ID=AW-XXXXXXXXXX
```

---

## ¿Cuándo veré datos reales?

| Dato | Tiempo de espera |
|---|---|
| Usuarios en tiempo real | Inmediato tras aceptar cookies |
| Primeros informes de sesión | 24-48 horas |
| Datos de Search Console en GA4 | 48-72 horas tras vincular |
| Audiencias de Meta disponibles | 24-48 horas (mínimo 100 usuarios) |
| Datos de conversión en Meta Ads | 24 horas tras primera conversión |

---

*Documento generado el 2026-04-07 · Lowkey Tattoo · tattoolowkey.com*
