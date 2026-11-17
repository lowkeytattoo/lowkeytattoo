import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { useCookieConsent } from "@web/contexts/CookieConsentContext";

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

interface CookieRow {
  name: string;
  owner: string;
  purpose: string;
  duration: string;
}

const CookieTable = ({ rows }: { rows: CookieRow[] }) => (
  <div className="overflow-x-auto -mx-1 px-1">
    <table className="w-full min-w-[520px] text-xs border border-border">
      <thead className="bg-card text-foreground font-mono uppercase tracking-wider">
        <tr>
          <th className="text-left p-2 border-b border-border">Nombre</th>
          <th className="text-left p-2 border-b border-border">Titular</th>
          <th className="text-left p-2 border-b border-border">Finalidad</th>
          <th className="text-left p-2 border-b border-border">Duración</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="align-top">
            <td className="p-2 border-b border-border font-mono text-foreground break-all">{r.name}</td>
            <td className="p-2 border-b border-border">{r.owner}</td>
            <td className="p-2 border-b border-border">{r.purpose}</td>
            <td className="p-2 border-b border-border whitespace-nowrap">{r.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TECHNICAL: CookieRow[] = [
  { name: "lowkey-consent", owner: "Lowkey Tattoo (propia)", purpose: "Guarda tus preferencias de cookies. Almacenamiento local del navegador.", duration: "12 meses" },
  { name: "lowkey-internal", owner: "Lowkey Tattoo (propia)", purpose: "Solo en dispositivos del personal: excluye sus visitas de las estadísticas.", duration: "Persistente" },
  { name: "sb-*-auth-token", owner: "Lowkey Tattoo (propia, vía Supabase)", purpose: "Solo en el área privada del personal: mantiene la sesión iniciada.", duration: "Hasta cerrar sesión" },
];

const ANALYTICS: CookieRow[] = [
  { name: "_ga", owner: "Google Ireland Ltd.", purpose: "Distingue usuarios de forma anónima para generar estadísticas de uso.", duration: "2 años" },
  { name: "_ga_<ID>", owner: "Google Ireland Ltd.", purpose: "Mantiene el estado de la sesión en Google Analytics 4.", duration: "2 años" },
];

const MARKETING: CookieRow[] = [
  { name: "_gcl_au", owner: "Google Ireland Ltd.", purpose: "Mide las conversiones de las campañas de Google Ads.", duration: "3 meses" },
  { name: "_fbp", owner: "Meta Platforms Ireland Ltd.", purpose: "Mide la eficacia de los anuncios de Meta (Facebook / Instagram).", duration: "3 meses" },
  { name: "fr", owner: "Meta Platforms Ireland Ltd.", purpose: "Muestra y mide anuncios en Facebook e Instagram (dominio facebook.com).", duration: "3 meses" },
];

const EXTERNAL: CookieRow[] = [
  { name: "NID y otras", owner: "Google Ireland Ltd.", purpose: "Instaladas por el mapa integrado de Google Maps (dominio google.com) para recordar preferencias y con fines propios de Google.", duration: "Hasta 6 meses" },
  { name: "Almacenamiento local de Elfsight", owner: "Elfsight Inc.", purpose: "Muestra nuestro feed de Instagram integrado y guarda datos técnicos del widget.", duration: "Persistente (hasta que lo borres)" },
];

export default function CookiesPage() {
  const { openSettings } = useCookieConsent();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Política de Cookies | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Política de cookies de Lowkey Tattoo: qué cookies usamos, para qué sirven, cuánto duran y cómo gestionarlas."
        />
        <link rel="canonical" href="https://tattoolowkey.com/politica-de-cookies" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Política de Cookies</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última actualización: noviembre de 2026
          </p>
        </header>

        <Section title="1. Qué son las cookies">
          <p>
            Las cookies y tecnologías similares (como el almacenamiento local del navegador) son
            pequeños archivos que una web guarda en tu dispositivo para recordar información sobre tu
            visita. Esta política cumple el art. 22.2 de la Ley 34/2002 (LSSI-CE) y sigue la Guía sobre
            el uso de las cookies de la Agencia Española de Protección de Datos.
          </p>
        </Section>

        <Section title="2. Cómo gestionar tus preferencias">
          <p>
            Las cookies no técnicas <B>solo se activan si las aceptas</B>. Puedes aceptarlas todas,
            rechazarlas todas o elegirlas por finalidad, y <B>cambiar o retirar tu consentimiento en
            cualquier momento</B> con la misma facilidad con que lo diste:
          </p>
          <button
            type="button"
            onClick={openSettings}
            className="font-mono text-xs tracking-[0.1em] uppercase border border-foreground/60 text-foreground px-4 py-2 rounded-sm hover:bg-foreground hover:text-background transition-colors duration-200"
          >
            Configurar cookies
          </button>
          <p>
            Este botón también está siempre disponible en el pie de página. Si retiras un consentimiento
            que habías dado, borramos las cookies de seguimiento de nuestro dominio y recargamos la
            página. Tu elección se recuerda durante 12 meses; después te la volveremos a pedir.
          </p>
          <p>
            También puedes bloquear o borrar cookies desde la configuración de tu navegador:{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>.
          </p>
        </Section>

        <Section title="3. Cookies técnicas (siempre activas)">
          <p>
            Son necesarias para que la web funcione y están exentas de consentimiento. No se usan
            para rastrearte.
          </p>
          <CookieTable rows={TECHNICAL} />
        </Section>

        <Section title="4. Cookies analíticas (requieren consentimiento)">
          <p>
            Usamos Google Analytics 4 para saber cuántas personas visitan la web y qué páginas
            consultan, con la IP anonimizada.
          </p>
          <CookieTable rows={ANALYTICS} />
        </Section>

        <Section title="5. Cookies de publicidad (requieren consentimiento)">
          <p>
            Sirven para medir el resultado de nuestras campañas en Google Ads y Meta (Facebook e
            Instagram) y para mostrarte anuncios relevantes.
          </p>
          <CookieTable rows={MARKETING} />
        </Section>

        <Section title="6. Contenido externo (requiere consentimiento)">
          <p>
            El mapa de la sección de contacto lo proporciona Google Maps y el feed de Instagram se
            muestra mediante Elfsight. Ninguno de los dos se carga, y por tanto no se envía ninguna
            información a esos proveedores, hasta que aceptas esta categoría o pulsas "Cargar mapa" o
            "Ver feed de Instagram".
          </p>
          <CookieTable rows={EXTERNAL} />
        </Section>

        <Section title="7. Transferencias internacionales">
          <p>
            Google, Meta y Elfsight pueden tratar los datos obtenidos con sus cookies fuera del Espacio
            Económico Europeo, en especial en EE. UU., amparándose en el Marco de Privacidad de Datos
            UE-EE. UU. Puedes consultar sus políticas en{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>{" "}
            y{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">facebook.com/privacy/policy</a>.
          </p>
        </Section>

        <Section title="8. Más información">
          <p>
            Para saber cómo tratamos tus datos personales y cómo ejercer tus derechos, consulta la{" "}
            <Link to="/politica-de-privacidad" className="underline underline-offset-2 hover:text-foreground">
              Política de Privacidad
            </Link>{" "}
            o escríbenos a{" "}
            <a href="mailto:info@tattoolowkey.com" className="underline underline-offset-2 hover:text-foreground">
              info@tattoolowkey.com
            </a>.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors mr-6">
            Política de Privacidad
          </Link>
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
