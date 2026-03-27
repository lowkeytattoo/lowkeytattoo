# Guía completa de Marketing Digital — Lowkey Tattoo

> Documento exhaustivo para configurar SEO, Google Analytics 4, Google Ads y Meta Pixel.
> Todo el código ya está integrado en la web. Esta guía cubre únicamente los pasos externos (cuentas, paneles, IDs).

---

## Índice

1. [Variables de entorno](#1-variables-de-entorno)
2. [Google Search Console + SEO](#2-google-search-console--seo)
3. [Google Analytics 4](#3-google-analytics-4)
4. [Google Ads](#4-google-ads)
5. [Meta Pixel (Facebook / Instagram)](#5-meta-pixel-facebook--instagram)
6. [Google Business Profile](#6-google-business-profile)
7. [Verificación final](#7-verificación-final)
8. [Mantenimiento mensual](#8-mantenimiento-mensual)

---

## 1. Variables de entorno

Todos los IDs de las plataformas se configuran en el fichero `.env` en la raíz del proyecto. **Este fichero nunca se sube a GitHub** (está en `.gitignore`).

### 1.1 Crear el fichero `.env`

```bash
# En la raíz del proyecto:
cp .env.example .env
```

### 1.2 Estructura del fichero `.env`

```env
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Ads
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXXX

# Meta Pixel
VITE_META_PIXEL_ID=XXXXXXXXXXXXXXX

# EmailJS (citas por email)
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx

# Google Calendar (disponibilidad)
VITE_GOOGLE_CALENDAR_API_KEY=AIzaSy_xxxxxxxxxxxxxxx
```

### 1.3 Añadir las variables en Vercel

Las variables de entorno también deben añadirse en el panel de Vercel para que funcionen en producción:

1. Ir a [vercel.com](https://vercel.com) → proyecto **lowkeytattoo**
2. **Settings** → **Environment Variables**
3. Añadir cada variable con su valor correspondiente
4. Seleccionar entornos: `Production`, `Preview`, `Development`
5. Clicar **Save**
6. Hacer **Redeploy** para que los cambios surtan efecto

---

## 2. Google Search Console + SEO

Google Search Console es la herramienta gratuita de Google para gestionar la presencia en los resultados de búsqueda. Es **imprescindible** para el SEO.

### 2.1 Crear cuenta y verificar la web

1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Clicar **Añadir propiedad**
3. Seleccionar **Prefijo de URL** e introducir: `https://lowkeytattoo.vercel.app/`
4. Elegir método de verificación: **Etiqueta HTML**
5. Copiar la etiqueta que proporciona Google. Tiene este aspecto:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXXXXXX" />
   ```
6. Añadirla en `index.html` dentro del `<head>`, justo después de `<meta name="author">`:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXXXXXX" />
   ```
7. Hacer deploy en Vercel y volver a Search Console → **Verificar**

### 2.2 Enviar el sitemap

Una vez verificada la propiedad:

1. En el menú lateral → **Sitemaps**
2. En el campo "Añadir nuevo sitemap" introducir: `sitemap.xml`
3. Clicar **Enviar**
4. El estado debe cambiar a **Correcto** en unos minutos

### 2.3 Solicitar indexación de la página principal

1. En Search Console → barra de búsqueda superior → pegar: `https://lowkeytattoo.vercel.app/`
2. Si aparece "La URL no está en Google" → clicar **Solicitar indexación**
3. Google suele indexar la página en 24–72 horas

### 2.4 Validar el Schema.org (JSON-LD)

El código ya incluye datos estructurados para que Google muestre información enriquecida (dirección, horarios, valoraciones) en los resultados.

1. Ir a [schema.org/validator](https://validator.schema.org/)
2. Pegar la URL: `https://lowkeytattoo.vercel.app/`
3. Verificar que aparecen sin errores los tipos `LocalBusiness` y `HealthAndBeautyBusiness`
4. También se puede usar [Google Rich Results Test](https://search.google.com/test/rich-results)

### 2.5 Monitorizar el rendimiento SEO

En Search Console, las secciones más importantes:

| Sección | Para qué sirve |
|---|---|
| **Rendimiento** | Ver qué keywords generan clics e impresiones |
| **Cobertura** | Ver páginas indexadas o con errores |
| **Experiencia de página** | Core Web Vitals (velocidad, estabilidad) |
| **Vínculos** | Ver qué webs enlazan a la tuya |

**Keywords objetivo a monitorizar** (añadirlas como filtro en Rendimiento):

- tatuajes santa cruz de tenerife
- tatuajes tenerife
- tattoo tenerife
- piercing tenerife
- estudio de tatuajes tenerife
- fine line tenerife
- blackwork tenerife
- lowkey tattoo

### 2.6 Google Business Profile (ficha de Google Maps)

> Ver sección 6 para la configuración completa. La ficha de GBP es el factor SEO local más importante — sin ella es casi imposible aparecer en el "Local Pack" (los 3 resultados con mapa que aparecen primero).

---

## 3. Google Analytics 4

GA4 permite ver en tiempo real quién visita la web, qué hacen, desde dónde vienen y qué eventos de conversión completan.

### 3.1 Crear la cuenta de GA4

1. Ir a [analytics.google.com](https://analytics.google.com)
2. Clicar **Empezar a medir**
3. **Nombre de la cuenta**: `Lowkey Tattoo`
4. **Nombre de la propiedad**: `lowkeytattoo.vercel.app`
5. **Zona horaria**: España (GMT+1)
6. **Moneda**: Euro (EUR)
7. Clicar **Siguiente** → Categoría del sector: **Arte y entretenimiento**
8. Clicar **Crear**

### 3.2 Configurar el flujo de datos web

1. En el panel de GA4 → **Administrar** (icono engranaje abajo a la izquierda)
2. Columna **Propiedad** → **Flujos de datos** → **Añadir flujo** → **Web**
3. **URL del sitio web**: `https://lowkeytattoo.vercel.app`
4. **Nombre del flujo**: `Lowkey Tattoo Web`
5. Clicar **Crear flujo**
6. Copiar el **ID de medición** (formato `G-XXXXXXXXXX`)
7. Pegarlo en el fichero `.env`: `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`
8. También añadirlo en las variables de entorno de Vercel (ver sección 1.3)

### 3.3 Verificar que los datos llegan

1. Hacer deploy del proyecto con el nuevo `.env`
2. En GA4 → **Informes** → **Tiempo real**
3. Abrir la web en otra pestaña del navegador
4. En GA4 debe aparecer "1 usuario en los últimos 30 minutos"

> **Importante**: el banner de cookies debe estar aceptado para que GA4 envíe datos. En modo desarrollo/prueba, aceptar el banner primero.

### 3.4 Eventos personalizados que ya se rastrean

El código ya envía automáticamente los siguientes eventos a GA4:

| Evento GA4 | Cuándo se dispara | Parámetros |
|---|---|---|
| `booking_open` | Al abrir el modal de cita | — |
| `booking_step_complete` | Al avanzar cada paso del modal | `step_number: 1, 2 o 3` |
| `booking_submit` | Al enviar el formulario de cita | `artist_name` |
| `cta_click` | Al clicar "Solicitar Cita" | `event_label: hero/navbar/mobile_menu` |
| `category_select` | Al clicar Tattoo/Piercing/Láser | `category_name` |
| `artist_view` | Al ver la tarjeta de un artista | `artist_id`, `artist_name` |
| `ig_click` | Al clicar cualquier link de Instagram | `ig_handle`, `click_location` |

### 3.5 Crear conversiones en GA4

Marcar `booking_submit` como conversión principal:

1. GA4 → **Administrar** → **Eventos**
2. Buscar `booking_submit` en la lista
3. Activar el interruptor **Marcar como conversión**
4. Repetir para `cta_click` (conversión secundaria)

### 3.6 Crear audiencias para remarketing

1. GA4 → **Administrar** → **Audiencias** → **Nueva audiencia**
2. Crear las siguientes audiencias:

**Audiencia 1 — Visitantes que abrieron el modal pero no reservaron:**
- Condición: `booking_open` ocurrió Y `booking_submit` NO ocurrió
- Ventana de membresía: 30 días
- Nombre: `Modal abierto sin reserva`

**Audiencia 2 — Visitantes que vieron la sección Tattoo:**
- Condición: `category_select` con `category_name = tattoo`
- Nombre: `Interesados en tattoo`

**Audiencia 3 — Todos los visitantes:**
- Condición: `page_view` ocurrió
- Nombre: `Todos los visitantes`

Estas audiencias se pueden usar después en Google Ads para remarketing.

### 3.7 Configurar informes personalizados recomendados

En GA4 → **Explorar** → **Exploración en blanco**, crear:

**Informe 1 — Funnel de reservas:**
- Técnica: Exploración de embudo
- Pasos: `booking_open` → `booking_step_complete (1)` → `booking_step_complete (2)` → `booking_step_complete (3)` → `booking_submit`
- Permite ver dónde abandonan los usuarios el proceso de reserva

**Informe 2 — Rendimiento por artista:**
- Dimensión: `artist_name` (parámetro de evento)
- Métrica: `Recuento de eventos` de `booking_submit`
- Permite ver qué artista genera más reservas

---

## 4. Google Ads

Google Ads permite aparecer en los primeros resultados de búsqueda de forma pagada. Fundamental para keywords muy competidas como "tatuajes tenerife".

### 4.1 Crear la cuenta de Google Ads

1. Ir a [ads.google.com](https://ads.google.com)
2. Clicar **Comenzar**
3. Usar el mismo correo de Google que la cuenta de Analytics
4. **Nombre de la empresa**: `Lowkey Tattoo`
5. **Sitio web**: `https://lowkeytattoo.vercel.app`
6. En la pantalla de campaña inicial → clicar **Cambiar al modo experto** (para tener control completo)
7. Seleccionar **Crear una cuenta sin campaña**
8. Completar la información de facturación (tarjeta de crédito)

### 4.2 Vincular Google Ads con GA4

1. En Google Ads → **Herramientas** (icono llave inglesa) → **Medición** → **Cuentas vinculadas**
2. Buscar **Google Analytics** → **Detalles** → **Vincular**
3. Seleccionar la propiedad `lowkeytattoo.vercel.app`
4. Activar **Habilitar importación de conversiones de GA4**
5. Clicar **Guardar**

### 4.3 Obtener el ID de Google Ads

1. En Google Ads → **Herramientas** → **Configuración de la cuenta**
2. El ID tiene formato `AW-XXXXXXXXXX` (aparece en la parte superior derecha)
3. Añadirlo en `.env`: `VITE_GOOGLE_ADS_ID=AW-XXXXXXXXXX`
4. También en las variables de Vercel

### 4.4 Crear acciones de conversión

Las conversiones son las acciones más valiosas que un usuario puede hacer. El código ya las envía — solo hay que crear los receptores en Google Ads.

#### Conversión 1 — Reserva enviada (principal)

1. Google Ads → **Herramientas** → **Medición** → **Conversiones** → **Nueva acción de conversión**
2. Seleccionar **Sitio web**
3. **Categoría**: Envío de formulario de cliente potencial
4. **Nombre de la conversión**: `booking_submit`
5. **Valor**: Sin valor (o introducir el valor medio de una sesión en €)
6. **Recuento**: Una (contar solo la primera conversión por sesión)
7. **Ventana de conversión**: 30 días
8. **Modelo de atribución**: Basado en datos
9. Clicar **Crear y continuar**
10. En "Configurar la etiqueta" → seleccionar **Usar Google Tag Manager** → NO tocar nada — el código ya lo gestiona automáticamente
11. Copiar la **Etiqueta de conversión** (formato `AW-XXXXXXXXXX/YYYYYYYYYYY`)

#### Conversión 2 — Clic en CTA (secundaria)

1. Repetir el proceso anterior con:
   - **Nombre**: `cta_click`
   - **Categoría**: Otro
   - **Recuento**: Varios

#### Actualizar el código con las etiquetas de conversión

Una vez obtenidas las etiquetas, actualizar `src/lib/analytics.ts`:

```typescript
// Buscar estas líneas y reemplazar con las etiquetas reales:

// Línea ~56:
if (ADS_ID) gtag("event", "conversion", { send_to: `${ADS_ID}/cta_click`, ... });
// Cambiar a:
if (ADS_ID) gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/YYYYYYYYYYY", ... });

// Línea ~65:
if (ADS_ID) gtag("event", "conversion", { send_to: `${ADS_ID}/booking_submit`, ... });
// Cambiar a:
if (ADS_ID) gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/ZZZZZZZZZZZ", ... });
```

### 4.5 Crear la primera campaña de búsqueda

#### Configuración de campaña

1. Google Ads → **Campañas** → **+** → **Nueva campaña**
2. **Objetivo**: Clientes potenciales
3. **Tipo de campaña**: Búsqueda
4. **Conversiones a optimizar**: `booking_submit`
5. **Nombre**: `Búsqueda — Tatuajes Tenerife`

#### Configuración de puja

- **Estrategia de puja**: Maximizar conversiones (cuando haya datos) o CPC manual (al inicio)
- **Presupuesto diario recomendado para empezar**: 10–15 €/día

#### Configuración de ubicación y idioma

- **Ubicaciones**: España → Comunidad Autónoma de Canarias → Tenerife
- También añadir: Santa Cruz de Tenerife (ciudad)
- **Radio adicional**: 50 km alrededor de Santa Cruz
- **Idiomas**: Español, Inglés

#### Grupos de anuncios y keywords

Crear 3 grupos de anuncios separados:

---

**Grupo 1 — Tatuajes generales**

Keywords (concordancia de frase — usar comillas):
```
"tatuajes tenerife"
"tattoo tenerife"
"tatuajes santa cruz de tenerife"
"estudio de tatuajes tenerife"
"hacerse un tatuaje tenerife"
"tatuador tenerife"
```

Keywords negativas (evitar clics irrelevantes):
```
-cursos
-academia
-precio tatuajes
-tatuajes temporales
-henna
-removedor
```

---

**Grupo 2 — Estilos específicos**

Keywords:
```
"fine line tenerife"
"tatuaje linea fina tenerife"
"blackwork tenerife"
"tatuaje geometrico tenerife"
"dotwork tenerife"
"tatuaje minimalista tenerife"
```

---

**Grupo 3 — Piercing**

Keywords:
```
"piercing tenerife"
"piercing santa cruz tenerife"
"piercing profesional tenerife"
"donde hacerse un piercing tenerife"
```

---

#### Crear los anuncios (Anuncios de búsqueda responsivos)

Para cada grupo, crear al menos 1 anuncio con:

**Títulos (máximo 30 caracteres cada uno — crear al menos 10):**
```
Tatuajes en Tenerife
Lowkey Tattoo Studio
Fine Line & Blackwork
Cita Online Disponible
Diseños Personalizados
Tatuadores Profesionales
Santa Cruz de Tenerife
Reserva Tu Cita Ya
Piercing Profesional
Estudio Discreto y Premium
```

**Descripciones (máximo 90 caracteres cada una — crear al menos 4):**
```
Estudio de tatuajes en Santa Cruz de Tenerife. Fine line, blackwork y piercing.
Pablo, Sergio y Fifo. Solicita tu cita online. Diseños personalizados.
Calle Dr. Allart, 50. Abierto de lunes a viernes 11:00–19:00.
Ambiente lowkey, resultados de alta gama. Reserva online en nuestra web.
```

**URL de visualización:**
```
lowkeytattoo.vercel.app/tatuajes-tenerife
```

#### Extensiones de anuncio (obligatorias)

1. **Extensión de llamada**: añadir el número de teléfono del estudio
2. **Extensión de ubicación**: vincular con Google Business Profile
3. **Extensión de enlace de sitio**:
   - Tattoo → `https://lowkeytattoo.vercel.app/#gallery`
   - Piercing → `https://lowkeytattoo.vercel.app/#gallery`
   - Contacto → `https://lowkeytattoo.vercel.app/#studio`
   - Solicitar cita → `https://lowkeytattoo.vercel.app/`
4. **Extensión de texto destacado**:
   - "Cita online disponible"
   - "3 artistas especializados"
   - "Fine Line · Blackwork · Piercing"
   - "Lunes a Viernes 11:00–19:00"

### 4.6 Campaña de remarketing (Display)

Una vez que GA4 lleve 30 días recogiendo datos y las audiencias tengan al menos 100 usuarios:

1. **Nueva campaña** → Objetivo: Notoriedad de marca → **Display**
2. **Nombre**: `Remarketing — Visitantes web`
3. **Audiencia**: Seleccionar `Modal abierto sin reserva` (creada en GA4)
4. **Presupuesto**: 3–5 €/día
5. **Anuncios**: Usar imágenes del estudio (las del banner, galería, etc.)
6. **Ubicaciones**: España

---

## 5. Meta Pixel (Facebook / Instagram)

El Pixel de Meta permite rastrear conversiones desde anuncios de Facebook e Instagram, crear audiencias personalizadas y hacer remarketing.

### 5.1 Crear el Pixel

1. Ir a [business.facebook.com](https://business.facebook.com)
2. Si no hay cuenta de Business Manager → crearla primero
3. **Menú** → **Events Manager** (Administrador de eventos)
4. Clicar **Conectar orígenes de datos** → **Web** → **Conectar**
5. **Nombre del Pixel**: `Lowkey Tattoo Pixel`
6. **URL del sitio**: `https://lowkeytattoo.vercel.app`
7. Clicar **Continuar**

### 5.2 Obtener el ID del Pixel

1. En Events Manager → seleccionar el Pixel recién creado
2. El **ID del Pixel** aparece debajo del nombre (15 dígitos numéricos)
3. Añadirlo en `.env`: `VITE_META_PIXEL_ID=XXXXXXXXXXXXXXX`
4. También en las variables de Vercel

### 5.3 Verificar el dominio en Meta

Meta exige verificar la propiedad del dominio para usar las conversiones:

1. **Business Settings** → **Brand Safety** → **Domains**
2. Clicar **Añadir** → introducir `lowkeytattoo.vercel.app`
3. Elegir método **Metatag HTML**
4. Copiar la etiqueta (parecida a la de Google):
   ```html
   <meta name="facebook-domain-verification" content="XXXXXXXXXXXXXX" />
   ```
5. Añadirla en `index.html` dentro del `<head>`
6. Hacer deploy y volver a Meta → **Verificar dominio**

### 5.4 Configurar los eventos de conversión

Los eventos ya se envían desde el código. Hay que configurarlos en Meta para optimizar anuncios:

1. Events Manager → **Pixel** → **Configurar eventos web**
2. Seleccionar **Configuración manual de eventos**
3. Verificar que aparecen los siguientes eventos (llegarán en cuanto haya tráfico):

| Evento Meta | Equivale a | Prioridad |
|---|---|---|
| `Lead` | Formulario de reserva enviado | Alta — conversión principal |
| `Contact` | Clic en botón "Solicitar Cita" | Media — conversión secundaria |
| `ViewContent` | Clic en categoría Tattoo/Piercing/Láser | Informativa |
| `PageView` | Carga de página | Base |

4. En **Administrar eventos** → marcar `Lead` como evento prioritario

### 5.5 Verificar con Meta Pixel Helper

1. Instalar la extensión [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) en Chrome
2. Abrir `https://lowkeytattoo.vercel.app`
3. **Aceptar las cookies** en el banner
4. La extensión debe mostrar el Pixel activo con el evento `PageView`
5. Abrir el modal de citas → debe aparecer el evento `Contact` (si se mide el clic en CTA)
6. Completar el formulario → debe aparecer el evento `Lead`

### 5.6 Crear audiencias personalizadas en Meta

1. **Business Manager** → **Audiencias** → **Crear audiencia** → **Audiencia personalizada**
2. Seleccionar **Sitio web**

**Audiencia 1 — Todos los visitantes:**
- Regla: Todos los que visitaron el sitio en los últimos 180 días
- Nombre: `Visitantes web — 180 días`

**Audiencia 2 — Intención alta (modal abierto):**
- Regla: `booking_open` en los últimos 30 días
- Nombre: `Abrieron modal de cita`

**Audiencia 3 — Interesados en tattoo:**
- Regla: `ViewContent` con `content_name = tattoo` en los últimos 60 días
- Nombre: `Vieron sección tattoo`

**Audiencia similar (Lookalike):**
- Basada en `Lead` (personas que reservaron)
- País: España
- Tamaño: 1–3% (más similares)
- Nombre: `Lookalike — Reservas`

### 5.7 Crear campaña en Meta Ads

1. **Ads Manager** → **Crear**
2. **Objetivo**: Clientes potenciales
3. **Nombre de la campaña**: `Lowkey Tattoo — Captación`

**Configuración del conjunto de anuncios:**
- **Presupuesto**: 10–15 €/día
- **Ubicaciones**: España — Tenerife + Canarias
- **Audiencia**: Intereses: Tatuajes, Body art, Instagram, Fine art
- **Edades**: 18–45
- **Evento de optimización**: `Lead`
- **Ventana de conversión**: 7 días clic + 1 día vista

**Anuncios recomendados:**
- **Formato**: Vídeo (los vídeos del feed de IG funcionan muy bien)
- **Formato alternativo**: Imagen única con el banner o fotos de trabajos
- **Copy principal**: "¿Buscas tatuaje en Tenerife? 🖤 Reserva online en Lowkey Tattoo"
- **CTA**: Más información → URL de la web

---

## 6. Google Business Profile

La ficha de Google Maps es el factor más importante para el SEO local. Aparecer en el "Local Pack" (los 3 resultados con mapa) genera más clics que los resultados orgánicos normales.

### 6.1 Crear o reclamar la ficha

1. Ir a [business.google.com](https://business.google.com)
2. Buscar "Lowkey Tattoo Santa Cruz de Tenerife"
3. Si ya existe → clicar **Reclamar este negocio**
4. Si no existe → **Añadir tu negocio**

### 6.2 Configuración básica obligatoria

Completar **todos** estos campos — los perfiles completos al 100% tienen un 70% más de visitas:

| Campo | Valor |
|---|---|
| **Nombre del negocio** | `Lowkey Tattoo` (exactamente igual que en la web) |
| **Categoría principal** | `Estudio de tatuajes` |
| **Categorías adicionales** | `Estudio de piercings`, `Salón de belleza` |
| **Dirección** | Calle Dr. Allart, 50, 38003, Santa Cruz de Tenerife |
| **Teléfono** | +34 674 116 189 |
| **Sitio web** | https://lowkeytattoo.vercel.app |
| **Horario** | Lunes–Viernes 11:00–19:00 / Sábado–Domingo Cerrado |
| **Horario especial** | Añadir festivos canarios |

### 6.3 Descripción del negocio (máximo 750 caracteres)

Usar este texto optimizado con keywords:

```
Estudio de tatuajes y piercing en Santa Cruz de Tenerife.
Especializados en fine line, blackwork, geometric y piercing profesional.
Nuestros tres artistas — Pablo Matos, Sergio y Fifo — crean diseños
100% personalizados en un ambiente discreto y cuidado.
Reserva tu cita online en nuestra web.
Calle Dr. Allart, 50 · Santa Cruz de Tenerife · Abierto de lunes a viernes.
```

### 6.4 Fotos (crítico para el CTR)

Subir al menos estas categorías de fotos:

- **Logo**: el logo de Lowkey Tattoo (fondo oscuro)
- **Portada**: el Banner_lowkeytattoo.jpg
- **Interiores** (5–10): fotos del estudio, ambiente, instalaciones
- **Equipo** (3): foto de cada artista
- **Trabajo** (20+): las mejores fotos de tatuajes y piercings
- **Exterior** (2–3): la fachada del local

> **Consejo**: subir nuevas fotos cada semana. Google favorece perfiles activos.

### 6.5 Servicios

Añadir servicios individuales con descripción y precio orientativo:

- Tatuaje Fine Line — Desde 80€
- Tatuaje Blackwork — Desde 100€
- Tatuaje Geométrico — Desde 80€
- Piercing Profesional — Desde 30€
- Eliminación Láser de Tatuajes — Consultar precio
- Diseño personalizado — Incluido

### 6.6 Publicaciones (Google Posts)

Publicar al menos 2 veces por semana para mantener la ficha activa:

- Fotos de trabajos recientes con descripción
- Ofertas especiales o disponibilidad
- Noticias del estudio (nuevo artista, nuevo servicio, etc.)

Cada publicación debe incluir keywords locales: "tatuaje tenerife", "santa cruz", etc.

### 6.7 Gestión de reseñas

Las reseñas son el factor local más importante después de la relevancia de la ficha.

**Cómo conseguir más reseñas:**
1. Copiar el link directo a las reseñas de Google:
   - GBP → **Obtener más reseñas** → copiar el enlace corto
2. Enviarlo a clientes satisfechos por WhatsApp justo después de la sesión
3. Añadir el enlace en la pantalla de éxito del modal de reservas (editar `SuccessStep.tsx`)
4. Responder SIEMPRE a todas las reseñas — positivas y negativas

**Objetivo mínimo**: 50 reseñas con valoración media ≥ 4.5 para competir en el Local Pack.

### 6.8 Preguntas y respuestas

Añadir preguntas frecuentes manualmente (sin esperar a que las hagan los usuarios):

- "¿Cómo puedo pedir cita?" → "Puedes solicitar tu cita online en nuestra web, en el botón 'Solicitar Cita'."
- "¿Cuánto cuesta un tatuaje?" → "El precio depende del tamaño y complejidad. Los precios empiezan desde 80€. Contacta para un presupuesto personalizado."
- "¿Aceptáis walk-ins sin cita?" → "Trabajamos principalmente con cita previa para garantizar la atención personalizada."
- "¿Dónde estáis?" → "Calle Dr. Allart, 50, Santa Cruz de Tenerife. A 5 minutos del centro."
- "¿Qué estilos hacéis?" → "Fine line, geometric, blackwork, dotwork, anime y piercing profesional."

---

## 7. Verificación final

Antes de lanzar las campañas de pago, verificar que todo funciona correctamente.

### 7.1 Checklist técnico

```
[ ] Variables de entorno añadidas en .env local
[ ] Variables de entorno añadidas en Vercel
[ ] Deploy realizado con las nuevas variables
[ ] Banner de cookies visible al entrar a la web
[ ] Al aceptar cookies → en GA4 Tiempo Real aparece el usuario
[ ] Meta Pixel Helper muestra PageView al cargar la web
[ ] Meta Pixel Helper muestra Lead al enviar el formulario de cita
[ ] Schema.org sin errores en schema.org/validator
[ ] Sitemap enviado y aceptado en Search Console
[ ] Indexación solicitada para la URL principal
[ ] Dominio verificado en Meta Business
```

### 7.2 Checklist de Google Ads

```
[ ] Cuenta creada y vinculada con GA4
[ ] ID de Google Ads (AW-XXXXXXXXXX) en .env y Vercel
[ ] Acciones de conversión creadas (booking_submit, cta_click)
[ ] Etiquetas de conversión actualizadas en src/lib/analytics.ts
[ ] Campaña de búsqueda configurada con keywords correctas
[ ] Keywords negativas añadidas
[ ] Al menos 3 anuncios por grupo de anuncios
[ ] Extensiones de anuncio configuradas (llamada, ubicación, sitelinks)
[ ] Facturación configurada
[ ] Modo de conversiones verificado con Google Tag Assistant
```

### 7.3 Checklist de Meta Ads

```
[ ] Pixel ID en .env y Vercel
[ ] Dominio verificado en Meta Business
[ ] Eventos PageView, Contact y Lead verificados con Pixel Helper
[ ] Audiencias personalizadas creadas (3 audiencias)
[ ] Audiencia Lookalike creada (esperar 30 días de datos)
[ ] Primera campaña configurada y en revisión
[ ] Materiales creativos (vídeos e imágenes) listos
```

### 7.4 Verificar con Google Tag Assistant

1. Instalar [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/) en Chrome
2. Abrir la web y aceptar el banner de cookies
3. Activar el Tag Assistant → debe mostrar:
   - GA4 tag activo (verde)
   - Google Ads Remarketing tag activo (verde)
4. Navegar por la web e interactuar con el modal → verificar que los eventos aparecen

---

## 8. Mantenimiento mensual

### Primeros 3 meses (fase de aprendizaje)

- **Semana 1**: Verificar que todos los datos llegan correctamente a GA4, Ads y Meta
- **Semana 2**: Revisar primeras keywords en Search Console → identificar términos de búsqueda reales
- **Semana 3**: Ajustar las pujas en Google Ads según el CPC real
- **Semana 4**: Analizar el funnel de reservas en GA4 → identificar el paso con más abandono

### Revisión mensual — GA4

1. **Adquisición** → ¿De dónde viene el tráfico? (Orgánico, Ads, Redes Sociales, Directo)
2. **Retención** → ¿Los usuarios vuelven?
3. **Conversiones** → ¿Cuántas reservas se generaron? ¿Qué artista tiene más?
4. **Dispositivos** → ¿Mayoría móvil o desktop? (afecta decisiones de diseño)

### Revisión mensual — Google Ads

1. **Informe de términos de búsqueda** → añadir keywords negativas a las que no convierten
2. **Puntuación de calidad** → mantener por encima de 7/10 en keywords principales
3. **CPA (Coste por Adquisición)** → objetivo: < 15€ por formulario de reserva enviado
4. **CTR** → objetivo: > 5% en búsqueda. Si es menor, mejorar los títulos de los anuncios
5. **Ajustes de puja** → aumentar presupuesto en días/horas con más conversiones

### Revisión mensual — Meta Ads

1. **CPL (Coste por Lead)** → objetivo: < 8€
2. **Frecuencia** → si supera 3 en 7 días, rotar los creativos
3. **Segmentación** → expandir a nuevas audiencias similares si la actual se satura
4. **Creativos** → probar nuevos vídeos e imágenes cada 3–4 semanas

### Revisión mensual — SEO

1. **Search Console** → posición media de keywords objetivo. Meta: top 5 en 6 meses
2. **Número de clics orgánicos** → tendencia creciente mes a mes
3. **Core Web Vitals** → LCP < 2.5s, CLS < 0.1, FID < 100ms
4. **Google Business Profile** → número de visitas a la ficha, llamadas, clicks al sitio web

### Tareas de SEO continuas

- Subir fotos nuevas al GBP semanalmente
- Publicar Google Posts 2 veces por semana
- Responder todas las reseñas en menos de 24 horas
- Actualizar el `sitemap.xml` con la fecha actual cuando se hagan cambios grandes en la web
- Solicitar reseñas a clientes satisfechos

---

## Apéndice — Recursos y herramientas

| Herramienta | URL | Para qué |
|---|---|---|
| Google Search Console | search.google.com/search-console | SEO, indexación, keywords |
| Google Analytics 4 | analytics.google.com | Tráfico, eventos, conversiones |
| Google Ads | ads.google.com | Campañas de pago en buscador |
| Meta Ads Manager | adsmanager.facebook.com | Campañas en Facebook e Instagram |
| Meta Business Suite | business.facebook.com | Gestión general de Meta |
| Google Business Profile | business.google.com | Ficha de Google Maps |
| Schema.org Validator | validator.schema.org | Validar datos estructurados |
| Google Rich Results Test | search.google.com/test/rich-results | Previsualizar resultados enriquecidos |
| PageSpeed Insights | pagespeed.web.dev | Core Web Vitals y velocidad |
| Meta Pixel Helper | Chrome Web Store | Verificar eventos del Pixel |
| Google Tag Assistant | Chrome Web Store | Verificar etiquetas de Google |
| Facebook Sharing Debugger | developers.facebook.com/tools/debug | Forzar actualización del preview OG |
| Vercel Dashboard | vercel.com | Variables de entorno, deploy |

---

*Documento generado el 17 de marzo de 2026. Actualizar cuando cambien los IDs de las plataformas o el dominio de producción.*
