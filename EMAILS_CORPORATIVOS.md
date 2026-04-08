# Emails corporativos @tattoolowkey.com — Guía gratuita
> Resultado: pablo@, sergio@, fifo@, info@tattoolowkey.com funcionando en Gmail sin coste

**Estrategia:** ImprovMX (reenvío gratuito) + Gmail "Enviar como" (SMTP gratuito)  
Cada artista recibe los emails en su Gmail personal y puede responder *desde* su dirección corporativa, sin salir de Gmail.

---

## Cómo funciona

```
Email recibido → pablo@tattoolowkey.com
                       ↓  ImprovMX reenvía
              pablo.personal@gmail.com   ← lo lee en Gmail normal

Email enviado  ← pablo@tattoolowkey.com
                       ↑  Gmail SMTP envía "en nombre de"
              pablo.personal@gmail.com   ← lo redacta en Gmail normal
```

---

## PARTE 1 — ImprovMX (reenvío de emails)

### 1.1 Crear cuenta
1. Ve a **improvmx.com** → "Get started for free"
2. Regístrate con tu email (el de gestión del estudio)

### 1.2 Añadir el dominio
1. En el dashboard → "Add a domain"
2. Escribe `tattoolowkey.com` → "Add domain"
3. ImprovMX te dará **2 registros MX** que debes copiar:
   ```
   Prioridad 10  →  mx1.improvmx.com
   Prioridad 20  →  mx2.improvmx.com
   ```

### 1.3 Crear los alias (reenvíos)
En ImprovMX → tu dominio → "Add alias":

| Alias | Reenviar a |
|-------|-----------|
| `pablo` | pablo.personal@gmail.com |
| `sergio` | sergio.personal@gmail.com |
| `fifo` | fifo.personal@gmail.com |
| `info` | tu-email-de-gestion@gmail.com |

---

## PARTE 2 — Vercel DNS (añadir los registros MX)

1. Ve a **vercel.com/dashboard** → tu proyecto → pestaña **"Domains"**
2. Haz clic en `tattoolowkey.com` → **"DNS Records"**
3. Añade los 2 registros MX (botón "Add"):

   | Type | Name | Value | Priority |
   |------|------|-------|----------|
   | MX | `@` | `mx1.improvmx.com` | `10` |
   | MX | `@` | `mx2.improvmx.com` | `20` |

4. Añade también el registro SPF (evita que los emails vayan a spam):

   | Type | Name | Value |
   |------|------|-------|
   | TXT | `@` | `v=spf1 include:spf.improvmx.com ~all` |

   > Solo hay conflicto si ya existe **otro registro SPF** (que empiece por `v=spf1`). Un TXT de verificación de Google Search Console es diferente — puedes tener ambos sin problema.

5. Guarda. La propagación tarda **entre 5 minutos y 1 hora**.

### Verificar que funciona
- Vuelve a ImprovMX → tu dominio → debería aparecer un tick verde "Domain verified"
- Prueba enviando un email a `info@tattoolowkey.com` desde cualquier cuenta → debe llegar al Gmail configurado

---

## PARTE 3 — Gmail "Enviar como" (cada artista lo hace en su propio Gmail)

Esto permite que cada artista responda emails *desde* `pablo@tattoolowkey.com` directamente en su Gmail.

> ⚠️ Cada artista debe hacer los pasos 3.1 y 3.2 en su propia cuenta de Google.

### 3.1 Activar verificación en dos pasos (requisito previo)
1. **myaccount.google.com** → Seguridad
2. "Verificación en dos pasos" → Activar (si no lo está ya)

### 3.2 Crear contraseña de aplicación
1. **myaccount.google.com** → Seguridad → **"Contraseñas de aplicaciones"**
   - (Si no aparece, busca en el buscador de la página: "contraseñas de aplicaciones")
2. En "Seleccionar app" elige **"Correo"**
3. En "Seleccionar dispositivo" elige **"Otro"** → escribe `Lowkey Tattoo`
4. Haz clic en **"Generar"**
5. Copia la contraseña de 16 caracteres que aparece → la necesitas en el paso 3.3

### 3.3 Añadir dirección en Gmail
1. Abre **Gmail** → ⚙️ Configuración → "Ver toda la configuración"
2. Pestaña **"Cuentas e importación"**
3. En "Enviar correo como" → **"Añadir otra dirección de correo"**
4. Rellena:
   - **Nombre:** `Pablo | Lowkey Tattoo` (o el nombre que quieras que vean)
   - **Dirección:** `pablo@tattoolowkey.com`
   - Desmarca "Tratar como alias"
   - → Siguiente
5. Rellena el servidor SMTP:
   - **Servidor SMTP:** `smtp.gmail.com`
   - **Puerto:** `587`
   - **Usuario:** `pablo.personal@gmail.com` ← su Gmail personal completo
   - **Contraseña:** la contraseña de 16 caracteres del paso 3.2
   - Selecciona **"Conexión segura TLS"**
   - → "Añadir cuenta"
6. Google enviará un código de verificación a `pablo@tattoolowkey.com` → que llega al Gmail personal gracias al reenvío de ImprovMX → introduce el código

### 3.4 Usar la dirección corporativa
- Al redactar un email en Gmail, el campo **"De:"** ahora tiene desplegable
- Selecciona `pablo@tattoolowkey.com` para enviar como corporativo
- Opcional: en Configuración → "Cuentas e importación" → marcar la dirección corporativa como **predeterminada**

---

## Repetir para cada cuenta

| Email | Gmail personal | Lo hace |
|-------|---------------|---------|
| pablo@tattoolowkey.com | pablo.personal@gmail.com | Pablo |
| sergio@tattoolowkey.com | sergio.personal@gmail.com | Sergio |
| fifo@tattoolowkey.com | fifo.personal@gmail.com | Fifo |
| info@tattoolowkey.com | gestion@gmail.com | Tú |

---

## Límites del plan gratuito de ImprovMX

| | Gratis |
|--|--------|
| Alias (reenvíos) | Ilimitados |
| Emails recibidos/mes | 500 |
| Tamaño máximo por email | 25 MB |
| Envío desde dominio propio | ✅ (via Gmail SMTP) |

500 emails/mes es suficiente para un estudio pequeño. Si en el futuro se supera, el plan Starter de ImprovMX cuesta **$9/mes para el dominio completo** (no por usuario).

---

## Notificaciones por email desde el formulario web (EmailJS)

> Pendiente de configurar. Permite recibir en `info@tattoolowkey.com` un email automático cada vez que alguien envíe el formulario de contacto de la web.

### Requisitos previos
- Emails corporativos funcionando (Partes 1-3 de esta guía)
- Cuenta en **emailjs.com** (gratuita, 200 emails/mes)

### PASO A — Crear cuenta y servicio en EmailJS
1. Ve a **emailjs.com** → "Sign Up"
2. Dashboard → "Email Services" → "Add New Service"
3. Elige **Gmail** → conecta con `info@tattoolowkey.com`
4. Nombre del servicio: `lowkey_service`
5. Guarda el **Service ID** (formato: `service_xxxxxxx`)

### PASO B — Crear template
1. Dashboard → "Email Templates" → "Create New Template"
2. Configura:

   | Campo | Valor |
   |-------|-------|
   | To email | `info@tattoolowkey.com` |
   | From name | `{{from_name}}` |
   | Subject | `Nuevo mensaje web — {{from_name}}` |

   Cuerpo:
   ```
   Nombre: {{from_name}}
   Contacto: {{from_contact}}

   Mensaje:
   {{message}}
   ```
3. Guarda el **Template ID** (formato: `template_xxxxxxx`)

### PASO C — Obtener Public Key
- Dashboard → "Account" → "General" → copia la **Public Key**

### PASO D — Configurar en el código
Con los 3 valores en mano, instalar y configurar:

```bash
npm install @emailjs/browser
```

Añadir en `.env`:
```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxx
```

En `StudioInfo.tsx`, dentro de `handleContactSubmit`, añadir tras el insert de Supabase:
```ts
import emailjs from "@emailjs/browser";

await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  { from_name: name, from_contact: contact, message },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
);
```

---

## Solución de problemas frecuentes

**"El email de verificación no llega"**
→ Comprueba que los registros MX están bien en Vercel y espera 30 min más. Puedes verificar en **mxtoolbox.com** → MX Lookup → `tattoolowkey.com`

**"No aparece 'Contraseñas de aplicaciones' en Google"**
→ La verificación en dos pasos no está activada. Es obligatoria para que aparezca esa opción.

**"El email llega al spam"**
→ Verifica que el registro SPF del paso 2.4 está bien propagado en mxtoolbox.com → TXT Lookup → `tattoolowkey.com`
