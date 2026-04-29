# Consentimientos Digitales en LOW TATTOO — Guía para el Estudio

---

## ¿Qué es esto y para qué sirve?

Actualmente, muchos estudios de tatuaje y piercing trabajan con consentimientos en papel. Esto tiene varios problemas:
- Los papeles se pierden o deterioran
- Son difíciles de consultar si hay una reclamación años después
- No quedan vinculados al historial del cliente
- Ocupan espacio físico

Este sistema permite que cada cliente **firme su consentimiento directamente en el iPad** del artista antes de la sesión, y el documento queda guardado automáticamente y vinculado a su ficha en el sistema.

---

## ¿Cómo funciona en la práctica?

El flujo es muy sencillo y lleva menos de 5 minutos:

### 1. El artista abre la ficha del cliente en el panel de administración (desde el iPad)

### 2. Pulsa el botón **"Nuevo consentimiento"**

### 3. Selecciona el tipo de servicio:
- Tatuaje
- Piercing
- Láser

### 4. El cliente rellena el cuestionario médico en el iPad
Preguntas sobre alergias, medicación, enfermedades relevantes, etc. El cliente responde sí/no directamente en la pantalla.

### 5. El cliente lee el resumen del procedimiento y los riesgos

### 6. El cliente **firma con el dedo o con el Apple Pencil** en la pantalla

### 7. Pulsar "Firmar y guardar"
El sistema genera automáticamente un PDF con todos los datos y la firma, y lo guarda en la ficha del cliente. En ese momento ya está todo hecho.

---

## ¿Por qué el iPad?

Todos los artistas del estudio ya tienen iPad para los diseños. Esto significa que:

- **No hace falta comprar ningún hardware nuevo**
- Todos ya saben usarlo
- El cliente tiene una experiencia visual cuidada (no una tableta negra genérica)
- La firma con Apple Pencil tiene una calidad excelente
- Es fácil limpiar y desinfectar entre clientes

El consentimiento firmado en iPad tiene **plena validez legal en España** cuando va acompañado de los datos del cliente, fecha y hora exacta, y el documento completo de información. Todo eso queda registrado automáticamente.

---

## ¿Dónde se guardan los consentimientos?

Los documentos se guardan en la **nube privada del estudio** (Supabase, el mismo sistema donde ya están las fichas de clientes, sesiones y fotos). Nadie externo tiene acceso.

Cada consentimiento queda:
- Vinculado a la ficha del cliente
- Con fecha y hora exacta de firma
- Como PDF descargable en cualquier momento desde el panel de administración
- Guardado indefinidamente (mínimo 5 años, que es lo recomendado legalmente)

---

## ¿Puedo ver o imprimir un consentimiento antiguo?

Sí. Desde la ficha de cualquier cliente, habrá una sección "Consentimientos" donde aparece el historial completo. Se puede:
- Ver el PDF en pantalla
- Descargarlo
- Imprimirlo si en algún momento fuera necesario

---

## ¿Qué documentos existen?

Se han preparado tres documentos legales completos, uno para cada servicio:

### Consentimiento de Tatuaje
Incluye:
- Datos personales del cliente
- Declaración de mayoría de edad (y protocolo para menores de 18)
- Cuestionario médico (14 preguntas: alergias, medicación, enfermedades, embarazo...)
- Descripción completa del procedimiento
- Lista de riesgos (comunes, poco frecuentes y raros)
- Instrucciones de cuidado postprocedimiento
- Cláusula de protección de datos (RGPD)
- Firma del cliente

### Consentimiento de Piercing
Incluye:
- Datos personales
- Protocolo específico para menores (16-17 años con tutor, menores de 16 solo lóbulos)
- Cuestionario médico (14 preguntas específicas para piercing)
- Tabla de tiempos de cicatrización por zona
- Riesgos generales y específicos por zona corporal
- Instrucciones de cuidado (qué hacer y qué NO hacer)
- Cláusula RGPD
- Firma del cliente

### Consentimiento de Láser
Incluye:
- Datos personales
- Evaluación del fototipo de piel (escala Fitzpatrick — importante para ajustar los parámetros del láser)
- Cuestionario médico (17 preguntas, incluyendo medicamentos fotosensibilizantes, isotretinoína, historial oncológico...)
- Información diferenciada para: eliminación de tatuajes / depilación / manchas
- Riesgos e información sobre limitaciones del tratamiento (no se garantiza eliminación total)
- Instrucciones pre y post tratamiento
- Información sobre seguridad del equipo láser (Clase IV)
- Cláusula RGPD (datos de salud como categoría especial)
- Firma del cliente

---

## ¿Es legal esta firma digital?

Sí. En España, la firma electrónica recogida en un dispositivo táctil (iPad, tablet) junto con:
- El documento completo de información firmado
- Fecha y hora exacta registrada por el sistema
- Datos identificativos del cliente
- Metadatos técnicos (dispositivo, navegador)

...cumple con los requisitos de la **Ley 41/2002 de Autonomía del Paciente**, el **Real Decreto 1088/2009** (que regula específicamente tatuajes y piercings) y el **Decreto 33/2012 de Canarias**.

Es el mismo sistema que usan clínicas de estética, fisioterapeutas y centros médicos en toda España.

---

## ¿Qué pasa con los menores de edad?

El sistema tiene protocolos específicos:

- **Tatuajes**: Permitido para menores siempre que cuenten con el consentimiento escrito del padre, madre o tutor legal, quien deberá firmar también el consentimiento y presentar documento acreditativo (libro de familia, DNI del tutor). El artista debe conservar copia de dicha documentación.
- **Piercing**:
  - Menores de 16 años: solo lóbulos de la oreja, con firma de ambos progenitores/tutor y documento acreditativo.
  - Entre 16 y 17 años: permitido con firma del tutor legal en el consentimiento.
- **Láser**: Solo mayores de 18 años.

---

## ¿Qué datos necesita aportar cada artista?

Como el estudio aún no opera como Sociedad Limitada, cada artista figura como responsable legal de sus propios consentimientos con su DNI personal. Esto es lo habitual en estudios de artistas autónomos.

Cada artista debe proporcionar los siguientes datos antes de activar el sistema:

| Campo | Descripción |
|---|---|
| **DNI** | El número de DNI o NIE personal del artista. Aparecerá en la cabecera de todos los consentimientos que ese artista genere. |
| **Teléfono** | Teléfono de contacto profesional (puede ser el del estudio). |
| **Certificado del Curso Higiénico-Sanitario** | El certificado del curso oficial que habilita legalmente para realizar tatuajes, piercings y técnicas similares. Junto con el alta en el epígrafe correcto del IAE, es lo que acredita al artista ante cualquier inspección o reclamación. |

### Datos compartidos por todos (del estudio)

| Campo | Descripción |
|---|---|
| Dirección del estudio | La dirección física que aparece en la cabecera |
| Email de contacto | Para que los clientes puedan ejercer sus derechos RGPD (acceso, supresión de datos, etc.) |

### ¿Cómo funciona según quién está logado?

El sistema es inteligente: **el consentimiento sale firmado automáticamente por el artista que tiene la sesión iniciada** en el iPad. Si Pablo está logado, el PDF muestra el nombre y DNI de Pablo. Si Sergio está logado, muestra el de Sergio. No hay que seleccionar nada manualmente.

Esto también afecta a los servicios disponibles: Fifo, por ejemplo, solo trabaja tatuajes, así que en su iPad solo aparecerá la opción de consentimiento de tatuaje. Pablo, que trabaja tatuaje, piercing y láser, verá las tres opciones.

### Tabla resumen por artista

| Artista | Servicios | DNI | Autorización sanitaria |
|---|---|---|---|
| Pablo Matos | Tatuaje, Piercing, Láser | pendiente | pendiente |
| Sergio | Tatuaje | pendiente | pendiente |
| Fifo | Tatuaje | pendiente | pendiente |

> **Nota:** La habilitación legal para ejercer no requiere un número de autorización sanitaria específico. Basta con estar dado de alta en el epígrafe correcto del IAE y disponer del certificado del Curso Higiénico-Sanitario. Ambos documentos son los que amparan legalmente al artista ante cualquier inspección o reclamación.

---

## Recomendación sobre el Apple Pencil

Para la firma, el cliente puede usar el dedo perfectamente. Pero si el estudio quiere ofrecer una experiencia más premium y una firma más precisa, se recomienda tener disponible el **Apple Pencil** del artista para que el cliente lo use en el momento de firmar. La firma con Pencil es notablemente más parecida a una firma manuscrita real.

---

## Preguntas frecuentes

**¿Se puede hacer sin conexión a internet?**  
No. El sistema necesita conexión para guardar el documento. El estudio ya tiene WiFi, por lo que no es un problema.

**¿El cliente se lleva una copia?**  
En una fase posterior se puede configurar para que el sistema envíe automáticamente una copia del PDF al email del cliente. Por ahora, si el cliente quiere una copia, el artista puede descargar el PDF e imprimírselo o enviárselo manualmente.

**¿Y los consentimientos en papel que ya tenemos?**  
No es necesario digitalizarlos todos. Se puede simplemente empezar a usar el sistema digital desde hoy en adelante. Los papeles existentes pueden archivarse físicamente como siempre.

**¿Qué pasa si el cliente se niega a firmar digitalmente?**  
El artista puede imprimir el documento (el PDF se puede generar en blanco), el cliente lo firma a mano, y el artista escanea o fotografía el papel firmado para subirlo manualmente al sistema. Aunque esto es un caso excepcional, está cubierto.

**¿Cada cuánto hay que actualizar los documentos?**  
Se recomienda revisar los textos legales una vez al año o cuando haya cambios normativos. El sistema lleva un número de versión en cada documento para saber cuál firmó cada cliente.

---

*Documento preparado por el equipo de desarrollo · Abril 2026*  
*Los textos de los consentimientos han sido redactados conforme a la normativa vigente en España y Canarias. Se recomienda revisión periódica por asesoría legal especializada en derecho sanitario.*
