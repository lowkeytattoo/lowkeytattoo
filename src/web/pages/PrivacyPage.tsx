import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-sm font-mono uppercase tracking-widest text-foreground mb-4 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {children}
    </div>
  </section>
);

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-foreground">{children}</strong>
);

const EMAIL = "info@tattoolowkey.com";

const Mail = () => (
  <a href={`mailto:${EMAIL}`} className="underline underline-offset-2 hover:text-foreground transition-colors">
    {EMAIL}
  </a>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Política de Privacidad | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Política de privacidad de Lowkey Tattoo. Información sobre el tratamiento de datos personales conforme al RGPD y la LOPDGDD."
        />
        <link rel="canonical" href="https://tattoolowkey.com/politica-de-privacidad" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Política de Privacidad</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última actualización: noviembre de 2026
          </p>
        </header>

        <Section title="1. Responsable del Tratamiento">
          <p><B>Responsable:</B> Pablo Matos Rodríguez (nombre comercial: Lowkey Tattoo)</p>
          <p><B>NIF:</B> 54050691R</p>
          <p><B>Domicilio:</B> Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife · Islas Canarias, España</p>
          <p><B>Email:</B> <Mail /></p>
          <p>
            <B>Teléfono:</B>{" "}
            <a href="tel:+34685314986" className="hover:text-foreground transition-colors">+34 685 314 986</a>
          </p>
          <p>
            Esta política explica cómo tratamos tus datos personales conforme al Reglamento (UE)
            2016/679 (RGPD) y a la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía
            de los derechos digitales (LOPDGDD).
          </p>
        </Section>

        <Section title="2. Qué Datos Tratamos">
          <p><B>a) Datos que nos facilitas a través de la web:</B></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <B>Formulario de cita:</B> nombre, teléfono, email, servicio y artista elegidos, fecha
              preferida, zona del cuerpo, descripción de lo que quieres y si es tu primera vez.
            </li>
            <li>
              <B>Formulario de contacto:</B> nombre, email o teléfono y el mensaje.
            </li>
            <li>
              <B>Datos de navegación:</B> solo si aceptas las cookies correspondientes (consulta la{" "}
              <Link to="/politica-de-cookies" className="underline underline-offset-2 hover:text-foreground">
                Política de Cookies
              </Link>).
            </li>
          </ul>
          <p><B>b) Datos que tratamos en el estudio (no a través de la web):</B></p>
          <p>
            Cuando te realizas un tatuaje, piercing o tratamiento láser, firmas en el estudio un
            documento de <B>consentimiento informado</B> que incluye tus datos identificativos, tu
            firma y un <B>cuestionario de salud</B> (por ejemplo, alergias, enfermedades de la piel o
            de transmisión sanguínea, embarazo o medicación). Estos datos de salud son una categoría
            especial de datos (art. 9 RGPD) y se tratan con las garantías del apartado 4. Si eres menor
            de edad, también tratamos los datos de tu representante legal.
          </p>
          <p>
            Como cliente, también guardamos el historial de tus sesiones y los datos necesarios para
            la facturación.
          </p>
        </Section>

        <Section title="3. Finalidades y Base Jurídica">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <B>Atender tu solicitud de cita o tu mensaje</B> y contactarte para confirmarla:
              aplicación de medidas precontractuales a petición tuya (art. 6.1.b RGPD).
            </li>
            <li>
              <B>Prestar el servicio</B> y gestionar la relación contigo (agenda, historial de
              sesiones, avisos sobre tu cita): ejecución del contrato (art. 6.1.b RGPD).
            </li>
            <li>
              <B>Consentimiento informado y cuestionario de salud:</B> valorar si el servicio puede
              hacerse con seguridad y cumplir la normativa higiénico-sanitaria aplicable a los
              estudios de tatuaje y piercing. Base: tu consentimiento explícito (art. 9.2.a RGPD) y el
              cumplimiento de obligaciones legales (art. 6.1.c RGPD).
            </li>
            <li>
              <B>Facturación y obligaciones contables y fiscales:</B> obligación legal (art. 6.1.c
              RGPD).
            </li>
            <li>
              <B>Analítica web, publicidad y contenido externo (cookies no técnicas):</B> tu
              consentimiento (art. 6.1.a RGPD), que puedes retirar en cualquier momento desde
              "Configurar cookies" en el pie de página.
            </li>
          </ul>
          <p>
            No tomamos decisiones automatizadas ni elaboramos perfiles con efectos jurídicos sobre ti.
            No es obligatorio facilitarnos tus datos, pero sin los marcados como obligatorios no
            podremos atender tu solicitud ni prestarte el servicio.
          </p>
        </Section>

        <Section title="4. Datos de Salud: Garantías Adicionales">
          <ul className="list-disc pl-5 space-y-1">
            <li>Solo se recogen en el estudio, en el momento del servicio, y nunca a través de la web.</li>
            <li>
              Solo pueden consultarlos los titulares del estudio y el profesional que te atiende, desde
              un área privada con usuario y contraseña. Cada artista solo accede a las fichas de sus
              propios clientes.
            </li>
            <li>
              Se guardan en almacenamiento privado con control de acceso, en servidores ubicados en la
              Unión Europea, y viajan cifrados (HTTPS).
            </li>
            <li>No se usan con fines comerciales ni se ceden a terceros, salvo obligación legal.</li>
            <li>Se conservan solo durante el tiempo mínimo exigido por la ley (apartado 5).</li>
          </ul>
        </Section>

        <Section title="5. Plazo de Conservación">
          <p>Conservamos tus datos solo durante el tiempo mínimo necesario o exigido por la ley:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <B>Solicitudes de cita y mensajes de contacto enviados por la web:</B> se eliminan
              automáticamente a los 12 meses. Si te conviertes en cliente, tus datos pasan a tu ficha
              de cliente (punto siguiente).
            </li>
            <li>
              <B>Datos de clientes y documentos de consentimiento informado:</B> mientras dure la
              relación y, después, 5 años desde el último servicio, plazo necesario para cumplir la
              normativa sanitaria aplicable y atender posibles responsabilidades legales.
            </li>
            <li>
              <B>Datos de facturación:</B> durante los plazos que fija la normativa fiscal y mercantil.
            </li>
            <li>
              <B>Cookies:</B> según los plazos indicados en la{" "}
              <Link to="/politica-de-cookies" className="underline underline-offset-2 hover:text-foreground">
                Política de Cookies
              </Link>
              . Tu elección sobre las cookies se recuerda durante 12 meses.
            </li>
          </ul>
          <p>
            Cuando terminan estos plazos, los datos se bloquean durante el tiempo de prescripción de
            las posibles responsabilidades (art. 32 LOPDGDD) y después se eliminan.
          </p>
        </Section>

        <Section title="6. Destinatarios y Encargados del Tratamiento">
          <p>
            No vendemos tus datos ni los cedemos a terceros con fines comerciales. Solo los comunicamos
            a las Administraciones Públicas, juzgados y tribunales cuando la ley lo exige. Para
            funcionar, usamos estos proveedores, que tratan los datos en nuestro nombre como
            encargados del tratamiento:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><B>Supabase Inc.</B>: base de datos y almacenamiento de archivos (servidores en la UE, Fráncfort).</li>
            <li><B>Vercel Inc.</B>: alojamiento de la página web.</li>
            <li><B>Brevo (Sendinblue SAS, Francia)</B>: envío de los emails de confirmación y de aviso.</li>
            <li><B>CallMeBot</B>: avisos internos por WhatsApp al equipo cuando entra una solicitud nueva. El aviso incluye tu nombre, teléfono, fecha solicitada, zona del cuerpo y descripción, necesarios para contactarte y valorar tu solicitud.</li>
            <li><B>Google</B>: Google Calendar (agenda interna). Además, solo si das tu consentimiento: Google Analytics, Google Ads y Google Maps.</li>
            <li><B>Meta Platforms Ireland Ltd.</B>: Meta Pixel, solo si das tu consentimiento.</li>
            <li><B>Elfsight Inc.</B>: muestra el feed de Instagram integrado, solo si aceptas el contenido externo.</li>
          </ul>
          <p>
            Si nos escribes por WhatsApp, Instagram o Facebook, esas plataformas también tratan tus
            datos según sus propias políticas de privacidad.
          </p>
        </Section>

        <Section title="7. Transferencias Internacionales">
          <p>
            Algunos proveedores (Google, Meta, Vercel y Elfsight) pueden tratar datos fuera del Espacio Económico
            Europeo, sobre todo en EE. UU. Esas transferencias se amparan en el Marco de Privacidad de
            Datos UE-EE. UU. (Decisión de adecuación de la Comisión Europea de 10 de julio de 2023) o,
            en su defecto, en las cláusulas contractuales tipo aprobadas por la Comisión Europea.
          </p>
        </Section>

        <Section title="8. Tus Derechos">
          <p>Puedes ejercer en cualquier momento estos derechos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><B>Acceso:</B> saber qué datos tuyos tratamos.</li>
            <li><B>Rectificación:</B> corregir los datos inexactos.</li>
            <li><B>Supresión:</B> pedir que eliminemos tus datos cuando ya no sean necesarios.</li>
            <li><B>Oposición:</B> oponerte a un tratamiento concreto.</li>
            <li><B>Limitación:</B> pedir que restrinjamos el tratamiento en determinados casos.</li>
            <li><B>Portabilidad:</B> recibir tus datos en un formato estructurado.</li>
            <li>
              <B>Retirar tu consentimiento</B> en cualquier momento. La retirada no afecta a la
              legalidad del tratamiento anterior.
            </li>
          </ul>
          <p>
            Para ejercerlos, escríbenos a <Mail /> o envía un escrito a nuestro domicilio, indicando qué
            derecho quieres ejercer. Si no podemos identificarte, podremos pedirte que acredites tu
            identidad. Te responderemos en el plazo máximo de un mes.
          </p>
          <p>
            Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la{" "}
            <B>Agencia Española de Protección de Datos (AEPD)</B> en{" "}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              www.aepd.es
            </a>.
          </p>
        </Section>

        <Section title="9. Menores de Edad">
          <p>
            Los formularios de esta web están pensados para mayores de edad. Los menores de 14 años no
            pueden facilitarnos sus datos sin el consentimiento de sus padres o tutores (art. 7
            LOPDGDD). Cualquier servicio a un menor de edad requiere la presencia y la autorización
            firmada de su representante legal en el estudio.
          </p>
        </Section>

        <Section title="10. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas adecuadas al riesgo para proteger tus datos
            frente a accesos no autorizados, pérdida o destrucción. Entre ellas: cifrado en tránsito
            (HTTPS), control de acceso por usuario y rol en la base de datos, almacenamiento privado de
            los documentos firmados y acceso al área interna solo con autenticación.
          </p>
        </Section>

        <Section title="11. Cambios en esta Política">
          <p>
            Podemos actualizar esta política para adaptarla a cambios legales o del servicio. La fecha
            de la última actualización figura al principio de la página.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to="/aviso-legal" className="hover:text-foreground transition-colors mr-6">
            Aviso Legal
          </Link>
          <Link to="/politica-de-cookies" className="hover:text-foreground transition-colors mr-6">
            Política de Cookies
          </Link>
          <Link to="/" className="hover:text-foreground transition-colors">
            Volver al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
