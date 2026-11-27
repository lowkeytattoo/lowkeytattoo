import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { ROUTES } from "@web/config/routes";

// English translation of LegalPage.tsx. Keep both in sync.

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

const r = ROUTES.en;

export default function LegalPageEn() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Legal Notice | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Lowkey Tattoo legal notice. Information about the website owner, intellectual property and terms of use."
        />
        <link rel="canonical" href="https://tattoolowkey.com/en/legal-notice" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Legal Notice</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Last updated: 27 November 2026
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            This is a translation for information purposes. If there is any discrepancy, the{" "}
            <Link to={ROUTES.es.legal} className="underline underline-offset-2 hover:text-foreground">
              Spanish version
            </Link>{" "}
            prevails.
          </p>
        </header>

        <Section title="1. Website Owner">
          <p>
            In compliance with Spanish Law 34/2002 of 11 July on Information Society Services and
            Electronic Commerce (LSSI-CE), we inform you that this website{" "}
            <strong className="text-foreground">tattoolowkey.com</strong> is owned by:
          </p>
          <ul className="list-none space-y-1.5">
            <li>
              <strong className="text-foreground">Owner:</strong> Pablo Matos Rodríguez
            </li>
            <li>
              <strong className="text-foreground">Tax ID (NIF):</strong> 54050691R
            </li>
            <li>
              <strong className="text-foreground">Trade name:</strong> Lowkey Tattoo
            </li>
            <li>
              <strong className="text-foreground">Activity:</strong> Professional tattoo, piercing and
              laser tattoo removal studio
            </li>
            <li>
              <strong className="text-foreground">Address:</strong> Calle Dr. Allart, 50 · 38003
              Santa Cruz de Tenerife · Canary Islands, Spain
            </li>
            <li>
              <strong className="text-foreground">Phone:</strong>{" "}
              <a href="tel:+34685314986" className="hover:text-foreground transition-colors">
                +34 685 314 986
              </a>
            </li>
            <li>
              <strong className="text-foreground">Email:</strong>{" "}
              <a href="mailto:info@tattoolowkey.com" className="hover:text-foreground transition-colors">
                info@tattoolowkey.com
              </a>
            </li>
            <li>
              <strong className="text-foreground">Website:</strong>{" "}
              <a href="https://tattoolowkey.com" className="hover:text-foreground transition-colors">
                https://tattoolowkey.com
              </a>
            </li>
          </ul>
        </Section>

        <Section title="2. Purpose and Terms of Use">
          <p>
            This website provides information about the tattoo, piercing and laser tattoo removal
            services offered by Lowkey Tattoo and allows you to request appointments.
          </p>
          <p>
            Accessing and using the website implies acceptance of these terms. The owner reserves the
            right to modify, update or remove the content of the website without prior notice.
          </p>
          <p>
            Users undertake to use the website lawfully and to refrain from any activity that could
            damage, disable or impair the website or prevent other users from using it normally.
          </p>
        </Section>

        <Section title="3. Intellectual and Industrial Property">
          <p>
            All content on the website — including texts, photographs, images, logos, designs, source
            code and structure — belongs to Lowkey Tattoo or to third parties who have authorised its
            use, and is protected by Spanish and international intellectual and industrial property
            law.
          </p>
          <p>
            Reproducing, distributing, publicly communicating or transforming this content without
            the express written authorisation of the owner is expressly prohibited, unless permitted
            by law.
          </p>
        </Section>

        <Section title="4. Disclaimer and Liability">
          <p>
            Lowkey Tattoo does not guarantee the continuous availability of the website or that its
            content is free of errors. It reserves the right to temporarily interrupt access for
            maintenance reasons.
          </p>
          <p>
            The prices and availability of the services shown on the website are for guidance only
            and may change. For up-to-date information, please contact the studio directly.
          </p>
          <p>
            The owner shall not be liable for damage arising from the use of the website or from
            linked third-party content, which is the sole responsibility of its owners.
          </p>
        </Section>

        <Section title="5. Privacy and Cookie Policy">
          <p>
            The processing of the personal data that users provide through the website is governed by
            the{" "}
            <Link to={r.privacy} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            . The use of cookies is explained in the{" "}
            <Link to={r.cookies} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="6. Governing Law and Jurisdiction">
          <p>
            This legal notice is governed by Spanish law. Any dispute arising from access to or use of
            this website shall be submitted to the competent courts and tribunals under the law. If
            the user is a consumer, the courts of their place of residence shall have jurisdiction.
          </p>
          <p>
            Consumers may also use the consumer arbitration system or other out-of-court dispute
            resolution methods.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to={r.privacy} className="hover:text-foreground transition-colors mr-6">
            Privacy Policy
          </Link>
          <Link to={r.cookies} className="hover:text-foreground transition-colors mr-6">
            Cookie Policy
          </Link>
          <Link to={r.home} className="hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
