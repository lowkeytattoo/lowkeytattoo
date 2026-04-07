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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Política de Privacidad | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Política de privacidad de Lowkey Tattoo. Información sobre el tratamiento de datos personales conforme al RGPD."
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
            Última actualización: abril de 2026
          </p>
        </header>

        <Section title="1. Responsable del Tratamiento">
          <p>
            <strong className="text-foreground">Nombre:</strong> Lowkey Tattoo
          </p>
          <p>
            <strong className="text-foreground">Domicilio:</strong> Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife · Islas Canarias, España
          </p>
          <p>
            <strong className="text-foreground">Teléfono:</strong>{" "}
            <a href="tel:+34674116189" className="hover:text-foreground transition-colors">
              +34 674 116 189
            </a>
          </p>
          <p>
            Para cualquier consulta sobre privacidad puedes contactarnos por teléfono o a través del
            formulario de reserva en{" "}
            <a href="https://tattoolowkey.com" className="hover:text-foreground transition-colors">
              tattoolowkey.com
            </a>.
          </p>
        </Section>

        <Section title="2. Datos que Recabamos">
          <p>
            Recabamos únicamente los datos necesarios para gestionar tu solicitud. Según la vía de
            contacto, estos pueden ser:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nombre y apellidos</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Descripción del servicio solicitado (tatuaje, piercing, láser)</li>
          </ul>
          <p>
            No recabamos datos especialmente protegidos ni datos de menores de 16 años sin el consentimiento
            expreso del tutor legal.
          </p>
        </Section>

        <Section title="3. Finalidad y Base Jurídica">
          <p>
            Tus datos se tratan con las siguientes finalidades y bases jurídicas (art. 6 RGPD):
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Gestión de citas y reservas:</strong> necesario para
              la ejecución del contrato de servicios (art. 6.1.b).
            </li>
            <li>
              <strong className="text-foreground">Comunicaciones sobre tu reserva:</strong> interés
              legítimo del negocio y tu propio interés como cliente (art. 6.1.f).
            </li>
            <li>
              <strong className="text-foreground">Análisis de uso del sitio web (cookies analíticas):</strong>{" "}
              consentimiento expreso (art. 6.1.a), revocable en cualquier momento.
            </li>
          </ul>
        </Section>

        <Section title="4. Plazo de Conservación">
          <p>
            Los datos vinculados a reservas se conservan durante el tiempo necesario para prestar el
            servicio y, posteriormente, durante <strong className="text-foreground">3 años</strong> a
            efectos de posibles reclamaciones conforme a la normativa de consumo española.
          </p>
          <p>
            Los datos de cookies analíticas se conservan según los plazos establecidos por Google
            Analytics (máximo 26 meses), salvo que retires el consentimiento antes.
          </p>
        </Section>

        <Section title="5. Tus Derechos">
          <p>
            Conforme al RGPD y la LOPDGDD, puedes ejercer los siguientes derechos sobre tus datos:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Acceso:</strong> conocer qué datos tenemos sobre ti.
            </li>
            <li>
              <strong className="text-foreground">Rectificación:</strong> corregir datos inexactos.
            </li>
            <li>
              <strong className="text-foreground">Supresión:</strong> solicitar la eliminación de tus datos.
            </li>
            <li>
              <strong className="text-foreground">Oposición:</strong> oponerte al tratamiento.
            </li>
            <li>
              <strong className="text-foreground">Portabilidad:</strong> recibir tus datos en formato
              estructurado.
            </li>
            <li>
              <strong className="text-foreground">Limitación:</strong> restringir el tratamiento en
              determinadas circunstancias.
            </li>
          </ul>
          <p>
            Para ejercerlos, contacta con nosotros por teléfono o en persona. Si consideras que tu
            solicitud no ha sido atendida correctamente, puedes presentar una reclamación ante la{" "}
            <strong className="text-foreground">
              Agencia Española de Protección de Datos (AEPD)
            </strong>{" "}
            en{" "}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              www.aepd.es
            </a>.
          </p>
        </Section>

        <Section title="6. Cesión de Datos a Terceros">
          <p>
            No cedemos ni vendemos tus datos a terceros con fines comerciales. Únicamente acceden a
            tus datos:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Supabase Inc.</strong> — plataforma de base de datos
              utilizada para almacenar reservas, con servidores en la UE (Frankfurt). Actúa como
              encargado del tratamiento bajo acuerdo DPA conforme al RGPD.
            </li>
            <li>
              <strong className="text-foreground">Google LLC (Analytics):</strong> herramienta de
              análisis web, únicamente si das tu consentimiento previo. Puedes rechazarlo o retirarlo
              en cualquier momento desde el banner de cookies.
            </li>
          </ul>
        </Section>

        <Section title="7. Cookies">
          <p>
            Utilizamos cookies técnicas (necesarias para el funcionamiento del sitio) y cookies
            analíticas (Google Analytics), estas últimas solo con tu consentimiento explícito.
          </p>
          <p>
            Puedes gestionar tus preferencias en el banner de cookies que aparece al visitar el sitio
            por primera vez, o revocar el consentimiento en cualquier momento borrando las cookies de
            tu navegador.
          </p>
        </Section>

        <Section title="8. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a
            accesos no autorizados, pérdida o destrucción, incluyendo cifrado en tránsito (HTTPS) y
            control de acceso a la base de datos.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to="/aviso-legal" className="hover:text-foreground transition-colors mr-6">
            Aviso Legal
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
