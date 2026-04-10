# Emails corporativos @tattoolowkey.com — Guía gratuita
> Resultado: pablo@, sergio@, fifo@, info@tattoolowkey.com funcionando en Gmail sin coste

**Estrategia:** ImprovMX (reenvío gratuito) + Brevo SMTP (envío con DKIM gratuito)  
Cada artista recibe los emails en su Gmail personal y puede responder *desde* su dirección corporativa, sin salir de Gmail. Los emails llegan a la bandeja principal (no a Promociones) gracias al DKIM de Brevo.

```
RECIBIR  →  ImprovMX  (reenvía a Gmail personal de cada artista)
ENVIAR   →  Brevo SMTP (firma DKIM — evita Promociones/Spam)
```

---

## PARTE 1 — ImprovMX (reenvío de emails) ✅ YA CONFIGURADO

### Registros DNS en Vercel (ya añadidos)
| Type | Name | Value | Priority |
|------|------|-------|----------|
| MX | `@` | `mx1.improvmx.com` | `10` |
| MX | `@` | `mx2.improvmx.com` | `20` |
| TXT | `@` | `v=spf1 include:spf.improvmx.com include:sendinblue.com ~all` | — |

> ⚠️ El SPF debe incluir `include:sendinblue.com` (Brevo) además de ImprovMX. Si solo tienes el de ImprovMX, actualízalo.

### Alias configurados
| Alias | Reenviar a |
|-------|-----------|
| `pablo` | pablo.personal@gmail.com |
| `sergio` | sergio.personal@gmail.com |
| `fifo` | fifo.personal@gmail.com |
| `info` | tu-email-de-gestion@gmail.com |

---

## PARTE 2 — Brevo SMTP (envío con DKIM)

### 2.1 Crear cuenta en Brevo
1. Ve a **[brevo.com](https://brevo.com)** → "Sign Up" (plan gratuito: 300 emails/día)
2. Verifica tu email personal de registro

### 2.2 Verificar el dominio (solo una vez para todos los emails)
1. Dashboard → **Senders & IPs → Domains → Add a domain**
2. Escribe `tattoolowkey.com`
3. Brevo te dará registros DNS — añádelos en Vercel DNS:

   | Type | Name | Valor |
   |------|------|-------|
   | TXT | `@` o el que indique | verificación de dominio |
   | TXT | `brevo._domainkey` | clave DKIM (larga) |

4. Vuelve a Brevo → **Verify** → espera hasta que aparezca ✓ en ambos registros

### 2.3 Añadir los remitentes
1. Dashboard → **Senders & IPs → Senders → Add a sender**
2. Añade los 4 uno a uno (el dominio ya está verificado, se aprueban automáticamente):
   - `info@tattoolowkey.com`
   - `pablo@tattoolowkey.com`
   - `sergio@tattoolowkey.com`
   - `fifo@tattoolowkey.com`

### 2.4 Obtener credenciales SMTP
1. Dashboard → **SMTP & API → SMTP**
2. Anota:
   - **Servidor:** `smtp-relay.brevo.com`
   - **Puerto:** `587`
   - **Usuario:** tu email de registro en Brevo
   - **Contraseña SMTP:** genera una clave con el botón "Generate a new SMTP key"

> Guarda bien la clave — solo se muestra una vez.

---

## PARTE 3 — Gmail "Enviar como" (cada artista en su propio Gmail)

> Cada artista hace los pasos 3.1 y 3.2 en su propio Gmail. Las credenciales SMTP son las mismas para todos (las de Brevo del paso 2.4).

### 3.1 Añadir dirección corporativa en Gmail
1. Abre **Gmail** → ⚙️ Configuración → "Ver toda la configuración"
2. Pestaña **"Cuentas e importación"**
3. "Enviar correo como" → **"Añadir otra dirección de correo"**
4. Rellena:
   - **Nombre:** `Pablo | Lowkey Tattoo`
   - **Dirección:** `pablo@tattoolowkey.com`
   - Desmarca "Tratar como alias" → Siguiente
5. Servidor SMTP:
   - **Servidor:** `smtp-relay.brevo.com`
   - **Puerto:** `587`
   - **Usuario:** el email de registro de Brevo (el del owner)
   - **Contraseña:** la clave SMTP de Brevo
   - Selecciona **TLS**
   - → "Añadir cuenta"
6. Google envía un código de verificación a `pablo@tattoolowkey.com` → llega al Gmail personal gracias a ImprovMX → introduce el código

### 3.2 Establecer como predeterminado (opcional)
- Gmail → Configuración → "Cuentas e importación" → marca la dirección corporativa como **predeterminada**

---

## Resumen por cuenta

| Email | Gmail personal | Quién lo configura |
|-------|---------------|-------------------|
| `info@tattoolowkey.com` | gestion@gmail.com | Owner |
| `pablo@tattoolowkey.com` | pablo.personal@gmail.com | Pablo |
| `sergio@tattoolowkey.com` | sergio.personal@gmail.com | Sergio |
| `fifo@tattoolowkey.com` | fifo.personal@gmail.com | Fifo |

> Las credenciales SMTP de Brevo son las mismas para los 4. Solo el campo "Dirección" cambia en cada Gmail.

---

## Límites del plan gratuito

| | ImprovMX Free | Brevo Free |
|--|--------------|------------|
| Emails recibidos | 500/mes | — |
| Emails enviados | — | 300/día |
| DKIM | ❌ | ✅ |
| Coste | Gratis | Gratis |

300 emails/día de Brevo es más que suficiente para un estudio pequeño. Si en el futuro se supera, el plan Starter de Brevo cuesta ~$25/mes.

---

## Solución de problemas

**"El email de verificación no llega"**
→ Comprueba los registros MX en **mxtoolbox.com** → MX Lookup → `tattoolowkey.com`

**"Error de autenticación en Gmail al añadir SMTP"**
→ Asegúrate de usar el email de registro de Brevo como usuario (no la dirección corporativa) y la clave SMTP (no tu contraseña de Brevo).

**"El email sigue yendo a Promociones"**
→ Verifica que el registro DKIM de Brevo está propagado: mxtoolbox.com → TXT Lookup → `brevo._domainkey.tattoolowkey.com`
→ Pide a los destinatarios que muevan el primer email a Bandeja de entrada y confirmen "Hacer siempre esto"

**"Gmail API: insufficient authentication scopes"**
→ Este error ocurría con la configuración anterior (Gmail SMTP directo). Con Brevo ya no aparece.

---

## Notificaciones por email desde el formulario web (EmailJS)

> Pendiente de configurar. Permite recibir en `info@tattoolowkey.com` un email automático cada vez que alguien envíe el formulario de contacto.

### Requisitos previos
- Emails corporativos funcionando (Partes 1-3 de esta guía) ✅
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
Dashboard → "Account" → "General" → copia la **Public Key**

### PASO D — Configurar en el código
```bash
npm install @emailjs/browser
```

Añadir en `.env.local`:
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
