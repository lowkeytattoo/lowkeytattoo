# Google Search Console — Guía completa
**Lowkey Tattoo — tattoolowkey.com**  
**Fecha:** Abril 2026

> Objetivo: dominar las búsquedas locales en Tenerife para tatuajes, piercing y eliminación láser.
> Esta guía cubre desde la creación hasta la estrategia avanzada para ser el nº1.

---

## Estado técnico SEO actual ✅

Antes de empezar, confirma que todo esto ya está en producción:

| Elemento | Estado | Detalle |
|---|---|---|
| sitemap.xml | ✅ | 8 URLs con hreflang ES/EN + imágenes |
| sitemap-images.xml | ✅ | Imágenes indexables por Google |
| robots.txt | ✅ | Admin bloqueado, todo lo demás abierto |
| `<link rel="sitemap">` en HTML | ✅ | Declarado en index.html |
| Canonical URLs | ✅ | En todas las páginas |
| hreflang es/en/x-default | ✅ | En todas las páginas |
| LocalBusiness schema | ✅ | Con geo, horarios, servicios |
| FAQPage schema | ✅ | ES + EN |
| BreadcrumbList schema | ✅ | Páginas de servicio y blog |
| BlogPosting schema | ✅ | Con dateModified y publisher |
| Google Analytics 4 | ✅ | G-TWXC2L3LQJ activo |
| Consent Mode v2 | ✅ | RGPD compliant |

Todo está en orden. Procede.

---

---

# PARTE 1 — CREAR Y CONFIGURAR SEARCH CONSOLE

---

## Paso 1 · Acceder a Google Search Console

1. Ve a **[search.google.com/search-console](https://search.google.com/search-console)**
2. Inicia sesión con la **misma cuenta de Google** con la que creaste GA4.
   > Usar la misma cuenta es importante — así la vinculación con Analytics es automática.

---

## Paso 2 · Añadir tu propiedad

1. Haz clic en **"Añadir propiedad"** (botón en la esquina superior izquierda, junto al selector de propiedades).
2. Verás dos opciones:

   | Tipo | Cuándo usar |
   |---|---|
   | **Dominio** | Cubre TODO el dominio: http, https, www, subdomains. Recomendado. |
   | **Prefijo de URL** | Solo cubre exactamente la URL que escribas. |

3. Selecciona **"Dominio"**.
4. Escribe: `tattoolowkey.com` (sin https://, sin www).
5. Haz clic en **Continuar**.

---

## Paso 3 · Verificar la propiedad (método DNS — el más robusto)

Google necesita verificar que eres el dueño del dominio. El método DNS es el que Google recomienda para propiedades de tipo "Dominio".

### Con Vercel (tu caso):

1. Google te dará un registro TXT. Tiene este aspecto:
   ```
   google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
2. Copia ese valor completo.
3. Ve a **[vercel.com](https://vercel.com)** → tu proyecto → pestaña **Settings** → **Domains**.
4. Haz clic en los tres puntos `···` junto a `tattoolowkey.com` → **"Manage DNS"**.
   > Si el DNS lo gestiona Vercel directamente, verás los registros ahí.
   > Si lo gestiona tu registrador (GoDaddy, Namecheap, etc.), tendrás que ir a ese panel.
5. Añade un nuevo registro DNS:
   - **Tipo:** `TXT`
   - **Nombre / Host:** `@` (o déjalo vacío — significa el dominio raíz)
   - **Valor:** pega el código de verificación de Google
   - **TTL:** 3600 (o el valor por defecto)
6. Guarda el registro.
7. Vuelve a Search Console y haz clic en **"Verificar"**.

> ⚠️ La propagación DNS puede tardar entre **5 minutos y 48 horas**. Si falla, espera 30 minutos y vuelve a intentarlo. Normalmente funciona en menos de 10 minutos con Vercel.

### Si no encuentras dónde añadir DNS en Vercel:

Es posible que tu dominio esté gestionado en otro sitio (el registrador donde compraste `tattoolowkey.com`). Accede a ese panel, busca la sección "DNS" o "Zone Editor" y añade el registro TXT ahí.

---

## Paso 4 · Confirmación de verificación

Cuando Google confirme la verificación verás:
- ✅ "Propiedad verificada"
- Acceso al panel de Search Console

> **Importante:** Aunque la verificación sea inmediata, los datos de rendimiento tardan **2-3 días** en aparecer. No significa que algo esté mal.

---

---

# PARTE 2 — ENVIAR EL SITEMAP

---

## Paso 5 · Enviar sitemap.xml

1. En Search Console, en el menú izquierdo → **"Sitemaps"**.
2. En el campo "Añadir nuevo sitemap" escribe la URL completa:
   ```
   https://tattoolowkey.com/sitemap.xml
   ```
3. Haz clic en **"Enviar"**.
4. Repite para el sitemap de imágenes:
   ```
   https://tattoolowkey.com/sitemap-images.xml
   ```

### Qué verás tras enviarlo:

| Estado | Significado |
|---|---|
| ⏳ Pendiente | Google lo ha recibido, aún no lo ha procesado |
| ✅ Correcto | Google procesó el sitemap sin errores |
| ❌ Error | Hay un problema en el XML (en tu caso no lo habrá) |

El número de **"URLs enviadas"** debería ser **8** (home, 3 servicios, blog, 3 posts).  
El número de **"URLs descubiertas"** puede tardar días en coincidir.

---

## Paso 6 · Solicitar indexación de las páginas clave

No esperes a que Google las descubra solo — pídelo tú directamente. Esto puede reducir el tiempo de indexación de semanas a días.

1. En Search Console → **"Inspección de URL"** (barra de búsqueda arriba o menú izquierdo).
2. Escribe cada URL y pulsa Enter:

**URLs a inspeccionar en orden de prioridad:**

```
https://tattoolowkey.com/
https://tattoolowkey.com/tatuajes-santa-cruz-tenerife
https://tattoolowkey.com/piercing-tenerife
https://tattoolowkey.com/laser-eliminacion-tatuajes-tenerife
https://tattoolowkey.com/blog
https://tattoolowkey.com/blog/estilos-de-tatuaje-guia-completa
https://tattoolowkey.com/blog/cuanto-cuesta-un-tatuaje-en-tenerife
https://tattoolowkey.com/blog/cuidados-despues-de-un-tatuaje
```

3. Para cada URL: si no está indexada, haz clic en **"Solicitar indexación"**.
4. Si ya está indexada verás "La URL está en Google" ✅.

> Google permite ~10 solicitudes de indexación por día. Empieza por las 4 primeras (home + 3 servicios).

---

---

# PARTE 3 — VINCULAR CON GOOGLE ANALYTICS 4

---

## Paso 7 · Vincular Search Console con GA4

Esta vinculación es lo que hace magia: en GA4 podrás ver exactamente qué términos de búsqueda traen tráfico a cada página.

### Desde Search Console:
1. En Search Console → **Configuración** (icono de engranaje abajo izquierda).
2. Haz clic en **"Asociaciones"**.
3. Haz clic en **"Asociar"** junto a Google Analytics.
4. Selecciona tu propiedad `tattoolowkey.com` de GA4.
5. Haz clic en **"Guardar"**.

### Desde GA4 (alternativa):
1. En GA4 → **Configurar** (engranaje abajo izquierda).
2. En la columna "Propiedad" → **"Vínculos de Search Console"**.
3. Haz clic en **"Vincular"**.
4. Selecciona tu propiedad de Search Console.
5. Selecciona el flujo de datos web de tattoolowkey.com.
6. Haz clic en **"Enviar"**.

### Qué desbloquea esta vinculación:

En GA4 aparecerá un nuevo informe: **Adquisición → Adquisición de tráfico → Google organic search**.

Verás para cada sesión orgánica:
- La **consulta de búsqueda** exacta que usó el usuario
- La **página de destino** donde llegó
- La **posición media** en Google
- El **CTR** (porcentaje que hace clic)

---

---

# PARTE 4 — ENTENDER LOS INFORMES

---

## Informe de Rendimiento (el más importante)

**Search Console → Rendimiento → Resultados de búsqueda**

Los 4 métricas clave:

| Métrica | Qué significa | Tu objetivo |
|---|---|---|
| **Clics** | Usuarios que hicieron clic en tu resultado | Crecer cada semana |
| **Impresiones** | Veces que apareciste en resultados (aunque no hicieran clic) | +500/mes en 30 días |
| **CTR** | % de impresiones que se convierten en clics | >5% para keywords locales |
| **Posición media** | Posición promedio en Google (1 = primero) | <5 para "tatuajes santa cruz" |

### Cómo usar este informe:

1. Cambia el período a **"Últimos 3 meses"** (cuando tengas datos).
2. Haz clic en la pestaña **"Consultas"** para ver las keywords.
3. Ordena por **Impresiones** descendente → verás para qué términos apareces más.
4. Busca keywords con **muchas impresiones pero bajo CTR** — esas tienen el mayor potencial de mejora.

**Ejemplo de análisis:**
```
"tatuajes tenerife" → 200 impresiones, posición 8, CTR 2%
→ Estás cerca del Top 5. Mejorar el título y descripción de la página puede
  subir el CTR al 8% → 4x más clics sin mover nada más.
```

---

## Informe de Cobertura (indexación)

**Search Console → Indexación → Páginas**

Categorías que debes monitorizar:

| Estado | Qué hacer |
|---|---|
| ✅ Indexadas | Perfecto — son las páginas que Google muestra |
| ⚠️ Válidas con advertencia | Revisar caso a caso (normalmente hreflang) |
| ❌ Excluidas | Normal para /admin/ y páginas noindex |
| 🔴 Con errores | Actuar inmediatamente |

> Objetivo a 30 días: mínimo **8 páginas indexadas** (tus 8 URLs del sitemap).

---

## Informe de Experiencia de Página

**Search Console → Experiencia → Experiencia de página**

Mide los **Core Web Vitals** — factores de ranking directo:

| Métrica | Qué mide | Objetivo |
|---|---|---|
| **LCP** | Tiempo hasta que carga el elemento más grande | < 2.5s |
| **INP** | Respuesta a interacciones del usuario | < 200ms |
| **CLS** | Estabilidad visual (que el contenido no "salte") | < 0.1 |

Si alguna está en rojo, se convierte en prioridad técnica.

---

---

# PARTE 5 — ESTRATEGIA PARA SER EL Nº1

---

## Cómo funciona el ranking local de Google

Google usa **3 factores principales** para el ranking local:

```
RANKING LOCAL = Relevancia × Distancia × Prominencia

Relevancia  → ¿Tu web habla de lo que busca el usuario?
Distancia   → ¿Qué tan cerca estás de donde busca?
Prominencia → ¿Cuántas personas confían en ti? (reseñas, links, autoridad)
```

Tu web ya tiene **Relevancia** al máximo técnico posible.  
**Distancia** no la controlas.  
**Prominencia** es donde está el trabajo ahora.

---

## Plan de acción mes a mes

### Semana 1-2 — Fundaciones (ahora)
- [x] Search Console verificado y sitemap enviado
- [x] GA4 funcionando
- [ ] **Google Business Profile** — completar al 100% (ver más abajo)
- [ ] **Solicitar indexación** de las 8 URLs principales

### Mes 1 — Autoridad local

**Google Business Profile (crítico para búsquedas locales):**
1. Ve a [business.google.com](https://business.google.com)
2. Crea o reclama el perfil de "Lowkey Tattoo"
3. Completa **todos** estos campos:
   - Nombre exacto: `Lowkey Tattoo`
   - Categoría principal: `Estudio de tatuajes`
   - Categorías secundarias: `Servicio de piercings`, `Clínica de eliminación de tatuajes`
   - Dirección: `Calle Dr. Allart, 50, 38003 Santa Cruz de Tenerife`
   - Teléfono: `+34 674 116 189`
   - Web: `https://tattoolowkey.com`
   - Horario: Lunes a viernes, 11:00-19:00
   - Descripción (750 chars): escribe sobre estilos, experiencia, ubicación
   - **Fotos**: mínimo 10 fotos de calidad (estudio, trabajos, equipo)
   - **Servicios**: lista cada servicio con precio orientativo

**Por qué es crítico:** El "Local Pack" de Google (los 3 negocios con mapa que aparecen primero) depende 90% de Google Business Profile. Si no estás ahí, no existes para búsquedas como "tatuajes cerca de mí".

**Estrategia de reseñas (el factor más poderoso):**
```
Objetivo mes 1: 10 reseñas con ≥4.8 estrellas

Cómo conseguirlas:
1. Crea un enlace corto a tu perfil de reseñas:
   business.google.com → "Recibir más reseñas" → copia el link
2. Envía por WhatsApp a tus últimos 20 clientes:
   "Hola [nombre], fue un placer tatuarte. Si quedaste contento
   con el resultado, una reseña nos ayudaría mucho 🙏
   Solo tarda 1 minuto: [link]"
3. Pon el link en tu bio de Instagram
4. No pidas 5 estrellas — pide honestidad (Google penaliza si detecta
   reseñas incentivadas de forma obvia)
```

### Mes 2 — Contenido y links

**Nuevos posts de blog (content SEO):**

| Post | Búsquedas/mes | Dificultad | Prioridad |
|---|---|---|---|
| "Piercing industrial Tenerife — guía completa" | ~200 | Muy baja | 🔴 Alta |
| "Eliminar tatuaje con láser: cuántas sesiones necesito" | ~1.800 | Media | 🔴 Alta |
| "Tatuaje fine line: todo lo que debes saber" | ~500 | Baja | 🟡 Media |
| "Cuidados del piercing los primeros días" | ~300 | Muy baja | 🟡 Media |

**Regla de contenido:** cada post debe tener mínimo 800 palabras, responder una pregunta real, y mencionar "Tenerife" o "Santa Cruz" naturalmente en el texto.

**Link building local (backlinks):**
Los backlinks (otros sitios que enlazan al tuyo) son el factor de autoridad más potente. Estrategia para Tenerife:

1. **Directorios locales** (gratis, impacto inmediato):
   - Páginas Amarillas España → [paginasamarillas.es](https://www.paginasamarillas.es)
   - Yelp España → [yelp.es](https://www.yelp.es)
   - Hotfrog España → [hotfrog.es](https://www.hotfrog.es)
   - TripAdvisor → [tripadvisor.es](https://www.tripadvisor.es)
   - Infoisinfo → [infoisinfo.es](https://www.infoisinfo.es)
   - Cylex España → [cylex.es](https://www.cylex.es)

2. **Medios locales** (alto impacto):
   - Diario de Avisos → contacta redacción para nota de prensa
   - El Día → sección de empresas y negocios locales
   - Canarias7 → sección de cultura y tendencias

3. **Colaboraciones con influencers de Tenerife** (búscalos en Instagram):
   - Microinfluencers (5k-50k seguidores) locales
   - Intercambio: tatuaje a coste de material por contenido + link en bio

### Mes 3 — Dominio técnico avanzado

**Schema AggregateRating** (cuando tengas ≥10 reseñas en Google):
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "15",
  "bestRating": "5"
}
```
Añadir esto al schema LocalBusiness en index.html mostrará las estrellas directamente en los resultados de Google → aumenta el CTR un 20-35%.

**Google Ads local** (cuando tengas presupuesto):
- Campaña de búsqueda con keywords: "tatuajes santa cruz de tenerife", "tatuaje tenerife precio", "estudio tatuaje tenerife"
- Presupuesto mínimo recomendado: 10€/día
- Haz remarketing a quienes visitaron la web pero no reservaron

---

## KPIs — Cómo saber que funciona

### Revisa esto cada lunes (5 minutos):

**Search Console → Rendimiento:**
```
Semana 1:  0-10 clics orgánicos (normal — Google está procesando)
Semana 2-4: 10-50 clics (crecimiento inicial)
Mes 2:      50-200 clics/semana
Mes 3:      200-500 clics/semana
```

**Posiciones objetivo para las keywords principales:**

| Keyword | Posición ahora | Objetivo mes 1 | Objetivo mes 3 |
|---|---|---|---|
| "tatuajes santa cruz de tenerife" | — | Top 10 | Top 3 |
| "tatuajes tenerife" | — | Top 15 | Top 5 |
| "piercing tenerife" | — | Top 10 | Top 3 |
| "eliminar tatuaje tenerife" | — | Top 10 | Top 5 |
| "estudio tatuaje tenerife" | — | Top 10 | Top 3 |

---

## Alertas que debes configurar

**En Search Console → Configuración → Notificaciones por email:**
- ✅ Activa las alertas de errores de cobertura
- ✅ Activa las alertas de problemas de usabilidad móvil
- ✅ Activa las alertas de problemas de Core Web Vitals

Así sabrás inmediatamente si Google detecta algún problema técnico.

---

## Checklist final antes de cerrar hoy

```
✅ Propiedad verificada en Search Console (tipo Dominio)
✅ sitemap.xml enviado
✅ sitemap-images.xml enviado
✅ Vinculado con GA4
✅ Indexación solicitada para las 4 páginas principales (2026-04-07)
□ Notificaciones por email activadas
□ Google Business Profile creado/reclamado y en proceso de completarse
```

---

## Preguntas frecuentes

**¿Cuándo apareceré en Google?**
Las páginas nuevas tardan entre 3 y 21 días en indexarse. Al solicitar indexación manualmente puede reducirse a 24-72 horas.

**¿Por qué mi web no aparece si busco "tatuajes santa cruz"?**
Porque Google aún no te conoce suficiente. Las primeras semanas aparecerás para búsquedas muy específicas (tu nombre, tu dirección exacta). Con el tiempo y las señales de autoridad (reseñas, links) subirás para keywords más competitivas.

**¿Cómo sé qué keywords me traen visitas?**
Search Console → Rendimiento → Consultas. Disponible 2-3 días después de la verificación.

**¿Cuánto tiempo hasta el nº1?**
Para "tatuajes santa cruz de tenerife": entre 2 y 6 meses con una estrategia activa de reseñas + contenido + links. Es una keyword local con competencia media — alcanzable.

---

*Documento generado el 2026-04-07 · Lowkey Tattoo · tattoolowkey.com*
