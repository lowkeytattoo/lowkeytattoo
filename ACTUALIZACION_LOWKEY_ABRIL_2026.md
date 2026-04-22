<div style="page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; min-height: 100vh; padding: 60px 60px 48px 60px; background: #0a0a0a; color: #ffffff; font-family: 'IBM Plex Mono', 'Courier New', monospace; box-sizing: border-box;">

  <div style="border-top: 1px solid #333; padding-top: 32px;">
    <p style="font-size: 10px; letter-spacing: 0.25em; color: #555; text-transform: uppercase; margin: 0 0 4px 0;">Documento confidencial</p>
    <p style="font-size: 10px; letter-spacing: 0.25em; color: #555; text-transform: uppercase; margin: 0;">Preparado para los propietarios de Lowkey Tattoo</p>
  </div>

  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 80px 0 60px 0;">
    <p style="font-size: 11px; letter-spacing: 0.3em; color: #666; text-transform: uppercase; margin: 0 0 24px 0;">tattoolowkey.com</p>
    <h1 style="font-family: 'Pirata One', Georgia, serif; font-size: 72px; font-weight: 400; color: #ffffff; margin: 0 0 12px 0; line-height: 1; letter-spacing: -1px;">Lowkey<br>Tattoo</h1>
    <div style="width: 48px; height: 1px; background: #e2c97e; margin: 28px 0;"></div>
    <h2 style="font-size: 18px; font-weight: 300; color: #cccccc; margin: 0 0 8px 0; letter-spacing: 0.05em;">Novedades de la plataforma</h2>
    <p style="font-size: 13px; color: #666; margin: 0; letter-spacing: 0.1em;">Actualización · 16 – 22 abril 2026</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; border-top: 1px solid #1e1e1e; padding-top: 32px; margin-bottom: 40px;">
    <div>
      <p style="font-size: 9px; letter-spacing: 0.2em; color: #555; text-transform: uppercase; margin: 0 0 6px 0;">Estudio</p>
      <p style="font-size: 12px; color: #aaa; margin: 0;">Calle Dr. Allart, 50<br>Santa Cruz de Tenerife</p>
    </div>
    <div>
      <p style="font-size: 9px; letter-spacing: 0.2em; color: #555; text-transform: uppercase; margin: 0 0 6px 0;">Web</p>
      <p style="font-size: 12px; color: #aaa; margin: 0;">tattoolowkey.com<br>@tattoo.lowkey</p>
    </div>
    <div>
      <p style="font-size: 9px; letter-spacing: 0.2em; color: #555; text-transform: uppercase; margin: 0 0 6px 0;">Periodo</p>
      <p style="font-size: 12px; color: #aaa; margin: 0;">Semana del 16 al 22<br>de abril de 2026</p>
    </div>
  </div>

  <div style="border-top: 1px solid #1a1a1a; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
    <p style="font-size: 9px; color: #333; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">Documento de uso interno · No distribuir</p>
    <p style="font-size: 9px; color: #333; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">Abril 2026</p>
  </div>

</div>

---

# Novedades — Semana del 16 al 22 de abril de 2026
### Resumen de mejoras para los propietarios del estudio

Esta actualización cubre todo lo que se ha añadido o mejorado desde la última presentación (13-14 de abril). Hay **4 áreas principales** de mejora: el portfolio de la web, el sistema de calendario, las notificaciones automáticas por email y el flujo de confirmación de reservas web.

---

## 1. Portfolio: nuevas fotos de los artistas

Se han incorporado fotos nuevas al portfolio visible para los clientes en la web pública.

| Artista | Fotos añadidas |
|---------|---------------|
| Pablo Matos | 2 trabajos nuevos (tatuajes) |
| Fifo | 5 trabajos nuevos (primera carga completa de su portfolio) |
| Sergio | 5 trabajos nuevos (primera carga completa de su portfolio) |
| Galería general | 6 fotos adicionales en la sección de inicio |

### Lightbox a pantalla completa

Al hacer clic en cualquier foto del portfolio, ahora se abre en **pantalla completa** con navegación entre imágenes:

- Flechas izquierda y derecha para pasar al trabajo anterior o siguiente
- Teclas del teclado (← →) y Escape para cerrar
- Contador de posición visible (`2 / 7`)
- Fondo oscuro con cierre al hacer clic fuera

### Galería paginada

Para no saturar la pantalla con demasiadas fotos a la vez, cada artista muestra ahora **solo dos filas de trabajos** con flechas para avanzar y retroceder. El número de página es visible en todo momento.

---

## 2. Calendario — integración directa con clientes y sesiones

Esta es la mejora más importante de esta semana. El calendario del panel ya no es solo una vista de citas: ahora permite **actuar sobre cada evento con un solo clic**.

### Panel de acción sobre eventos

Al hacer clic en cualquier evento del calendario aparece un **panel lateral** con toda la información de la cita y tres acciones disponibles:

**Editar la cita**
Se puede modificar el título, la fecha, la hora de inicio y fin, y las notas directamente desde el panel, sin salir del calendario. Los cambios se guardan en Google Calendar al instante.

**Eliminar la cita**
Confirmación rápida antes de borrar. El evento desaparece del Google Calendar del artista.

**Registrar sesión**
El botón más importante. Abre un flujo guiado de 3 pasos que convierte el evento del calendario en una sesión real registrada en la base de datos del estudio:

> **Paso 1 — Buscar cliente:** Buscador en tiempo real con el nombre, teléfono o email del cliente. Si ya existe en la base de datos, se selecciona y se salta el paso 2.
>
> **Paso 2 — Crear cliente:** Si el cliente es nuevo, se rellena su ficha (nombre, teléfono, email, notas, alergias) y queda registrado permanentemente.
>
> **Paso 3 — Datos de la sesión:** Tipo de servicio, precio, señal recibida, zona del cuerpo, estilo, duración y notas. Al confirmar:
> - La sesión queda registrada en la base de datos
> - El evento en Google Calendar cambia de color a **verde** (indicando que está registrado en la app)
> - El artista y el admin reciben un email automático de confirmación
> - La app navega directamente al perfil del cliente

### Código de color en Google Calendar

A partir de ahora los eventos en los calendarios de Google tienen colores distintos según su origen:

| Color | Significado |
|-------|-------------|
| Color por defecto | Cita manual sin sesión registrada aún |
| 🟢 Verde (Sage) | Sesión registrada desde la app |
| 🔵 Azul (Peacock) | Reserva web confirmada y convertida en sesión |

El artista puede ver de un vistazo, directamente en su Google Calendar desde el móvil, cuáles de sus citas ya están gestionadas en el sistema y cuáles están pendientes.

---

## 3. Citas web — confirmación mejorada

La sección de **Citas Web** del panel ha mejorado el flujo de confirmación de reservas.

### Antes
El botón "Convertir" creaba una sesión con los datos de la reserva, pero era un proceso manual que no conectaba todos los puntos.

### Ahora
El botón **"Confirmar"** abre un flujo completo de 2 pasos:

> **Paso 1 — Cliente:** El sistema comprueba automáticamente si el número de teléfono o email de quien reservó ya existe en la base de datos de clientes. Si existe, lo muestra para confirmación. Si es cliente nuevo, indica que se creará su ficha.
>
> **Paso 2 — Sesión:** Formulario pre-rellenado con todos los datos de la reserva web (fecha solicitada, tipo de servicio, zona del cuerpo, descripción). Se puede ajustar precio, señal, duración y notas antes de confirmar.

Al confirmar:
1. Se crea el cliente si es nuevo (o se usa el existente)
2. La sesión queda registrada en la base de datos
3. Se crea automáticamente un evento **azul** en el Google Calendar del artista
4. La reserva web queda marcada como **"Confirmada"** en el sistema
5. El artista y el admin reciben un email automático de confirmación

---

## 4. Notificaciones automáticas por email

Se ha implementado un sistema completo de **notificaciones por email en tiempo real** para todas las acciones del calendario.

### Cuándo se envía un email

| Acción en el panel | Email automático |
|--------------------|-----------------|
| Crear una nueva cita en el calendario | ✅ Sí |
| Modificar fecha, hora o datos de una cita | ✅ Sí (incluye fecha/hora anterior para comparar) |
| Eliminar una cita del calendario | ✅ Sí |
| Registrar una sesión desde un evento | ✅ Sí |
| Confirmar una reserva web | ✅ Sí |

### Quién recibe los emails

- **El artista** cuyo calendario contiene el evento (`pablo@tattoolowkey.com`, etc.)
- **El admin del estudio** (`info@tattoolowkey.com`)
- Si el artista y el admin son la misma persona, se envía un único email (sin duplicados)

### Qué contiene cada email

- Tipo de acción (nueva cita / modificación / eliminación / sesión registrada / reserva confirmada)
- Nombre del artista
- Nombre del cliente (si aplica)
- Fecha y hora del evento
- Duración
- En modificaciones: la fecha y hora **anterior** para saber qué cambió exactamente
- Enlace directo al perfil del cliente en la app (cuando aplica)

### Servicio de envío

Los emails se envían a través de **Brevo** (300 emails/día incluidos en el plan gratuito), lo que garantiza que no vayan a spam y queden registrados en el dashboard de Brevo con estado de entrega.

---

## Resumen de lo añadido esta semana

| Mejora | Impacto |
|--------|---------|
| 17 fotos nuevas en el portfolio (Pablo, Fifo, Sergio) | Más contenido visual para los clientes |
| Lightbox con navegación en el portfolio | Mejor experiencia de navegación de trabajos |
| Galería paginada por artista | Página más limpia y rápida de cargar |
| Panel de acción sobre eventos del calendario | Reducción de pasos para gestionar citas |
| Registro de sesión directamente desde el calendario | Elimina duplicar trabajo entre calendario y sesiones |
| Color-coding de eventos en Google Calendar | Visibilidad del estado de gestión desde el móvil |
| Confirmación mejorada de reservas web | Flujo completo en 2 pasos con detección de cliente existente |
| Notificaciones por email para todas las acciones | Artista y admin informados en tiempo real de cada cambio |

---

## Estado actualizado del panel de administración

| Sección | Estado | Novedades esta semana |
|---------|--------|-----------------------|
| Dashboard | ✅ Activo | — |
| Clientes | ✅ Activo | Se crean automáticamente desde el calendario y reservas web |
| Sesiones | ✅ Activo | Se crean automáticamente desde el calendario y reservas web |
| Calendario | ✅ Mejorado | Panel de acción, registro de sesión, color-coding, multi-artista |
| Citas Web | ✅ Mejorado | Nuevo flujo de confirmación completo en 2 pasos |
| Mensajes | ✅ Activo | — |
| Finanzas | ✅ Activo | — |
| Stock | ✅ Activo | — |
| Blog | ✅ Activo | — |
| Artistas | ✅ Activo | — |

---

## Objetivos completados desde la última presentación

Además de las mejoras técnicas de esta semana, se han cerrado dos de los tres puntos prioritarios que quedaban pendientes:

| Objetivo | Estado |
|----------|--------|
| Google Business Profile verificado y completo | ✅ Completado |
| 20 reseñas de 5 estrellas en Google | ✅ Completado |
| Blog — publicar regularmente | 🔄 En curso |

### Google Business Profile

El perfil de Lowkey Tattoo en Google Maps está verificado y completo. Esto significa que el estudio ya aparece en el mapa cuando alguien busca "tatuajes" o "tattoo" en Tenerife desde su móvil, con horarios, dirección, fotos y enlace directo a la web.

### 20 reseñas de 5 estrellas

Con 20 reseñas de 5 estrellas, Lowkey Tattoo tiene ahora una de las valoraciones más sólidas en Google entre los estudios de tatuaje de Santa Cruz de Tenerife. Las reseñas son el factor de posicionamiento más importante en Google Maps — cada reseña nueva refuerza la visibilidad local de forma directa.

**Impacto esperado:** A medida que Google indexe el perfil con actividad continua (fotos nuevas, respuestas a reseñas, publicaciones), la posición en el mapa mejorará progresivamente para búsquedas como *"tatuajes Santa Cruz de Tenerife"* y *"tattoo studio Tenerife"*.

---

## Próximo paso prioritario

**Blog — publicar regularmente**
Es el único punto pendiente de los tres originales. Cada artículo nuevo es una entrada adicional en Google. Temas con alto potencial de tráfico: *"cuidados después de un tatuaje"*, *"cuánto dura la eliminación láser"*, *"estilos de tatuaje más populares en 2026"*. Se recomienda **un artículo al mes como mínimo**.

---

*Documento preparado para los propietarios de Lowkey Tattoo — Abril 2026*
*Calle Dr. Allart, 50 · Santa Cruz de Tenerife · tattoolowkey.com*
