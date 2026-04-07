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

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Aviso Legal | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Aviso legal de Lowkey Tattoo. Información sobre el titular del sitio web, propiedad intelectual y condiciones de uso."
        />
        <link rel="canonical" href="https://tattoolowkey.com/aviso-legal" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Aviso Legal</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Última actualización: abril de 2026
          </p>
        </header>

        <Section title="1. Identificación del Titular">
          <p>
            En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
            Información y de Comercio Electrónico (LSSI-CE), se informa que el presente sitio web{" "}
            <strong className="text-foreground">tattoolowkey.com</strong> es titularidad de:
          </p>
          <ul className="list-none space-y-1.5">
            <li>
              <strong className="text-foreground">Nombre comercial:</strong> Lowkey Tattoo
            </li>
            <li>
              <strong className="text-foreground">Actividad:</strong> Estudio de tatuajes y piercing
              profesional
            </li>
            <li>
              <strong className="text-foreground">Domicilio:</strong> Calle Dr. Allart, 50 · 38003
              Santa Cruz de Tenerife · Islas Canarias, España
            </li>
            <li>
              <strong className="text-foreground">Teléfono:</strong>{" "}
              <a href="tel:+34674116189" className="hover:text-foreground transition-colors">
                +34 674 116 189
              </a>
            </li>
            <li>
              <strong className="text-foreground">Web:</strong>{" "}
              <a
                href="https://tattoolowkey.com"
                className="hover:text-foreground transition-colors"
              >
                https://tattoolowkey.com
              </a>
            </li>
          </ul>
        </Section>

        <Section title="2. Objeto y Condiciones de Uso">
          <p>
            El presente sitio web tiene por objeto ofrecer información sobre los servicios de
            tatuaje, piercing y eliminación de tatuajes con láser prestados por Lowkey Tattoo, así
            como facilitar la solicitud de citas.
          </p>
          <p>
            El acceso y uso del sitio web implica la aceptación de las presentes condiciones. El
            titular se reserva el derecho a modificar, actualizar o suprimir el contenido del sitio
            sin previo aviso.
          </p>
          <p>
            El usuario se compromete a hacer un uso lícito del sitio, absteniéndose de cualquier
            actividad que pueda dañar, inutilizar o deteriorar el sitio o impedir un normal disfrute
            por parte de otros usuarios.
          </p>
        </Section>

        <Section title="3. Propiedad Intelectual e Industrial">
          <p>
            Todos los contenidos del sitio web — incluyendo textos, fotografías, imágenes,
            logotipos, diseños, código fuente y estructura — son propiedad de Lowkey Tattoo o de
            terceros que han autorizado su uso, y están protegidos por la legislación española e
            internacional sobre propiedad intelectual e industrial.
          </p>
          <p>
            Queda expresamente prohibida la reproducción, distribución, comunicación pública o
            transformación de dichos contenidos sin la autorización expresa y escrita del titular,
            salvo que la ley expresamente lo permita.
          </p>
        </Section>

        <Section title="4. Exclusión de Garantías y Responsabilidad">
          <p>
            Lowkey Tattoo no garantiza la disponibilidad continua del sitio ni la ausencia de errores
            en su contenido. Se reserva el derecho a interrumpir el acceso temporalmente por razones
            de mantenimiento.
          </p>
          <p>
            Los precios y disponibilidad de los servicios mostrados en el sitio son orientativos y
            pueden variar. Para obtener información actualizada, contacta directamente con el estudio.
          </p>
          <p>
            El titular no será responsable de los daños derivados del uso del sitio web ni de los
            contenidos enlazados a terceros, cuya responsabilidad corresponde exclusivamente a sus
            propietarios.
          </p>
        </Section>

        <Section title="5. Política de Privacidad y Cookies">
          <p>
            El tratamiento de los datos personales que el usuario facilite a través del sitio web se
            rige por la{" "}
            <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
            , que el usuario debe leer y aceptar antes de facilitar sus datos.
          </p>
        </Section>

        <Section title="6. Ley Aplicable y Jurisdicción">
          <p>
            El presente aviso legal se rige por la legislación española. Para cualquier controversia
            derivada del acceso o uso de este sitio web, las partes se someten a la jurisdicción de
            los Juzgados y Tribunales de{" "}
            <strong className="text-foreground">Santa Cruz de Tenerife</strong>, con renuncia
            expresa a cualquier otro fuero que pudiera corresponderles.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to="/politica-de-privacidad" className="hover:text-foreground transition-colors mr-6">
            Política de Privacidad
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
