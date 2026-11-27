import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { ROUTES } from "@web/config/routes";

// English translation of PrivacyPage.tsx. Keep both in sync: when the Spanish
// text changes, update this page and its "Last updated" date too.

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

const r = ROUTES.en;

export default function PrivacyPageEn() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Privacy Policy | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Lowkey Tattoo privacy policy. How we process personal data under the GDPR and Spanish data protection law."
        />
        <link rel="canonical" href="https://tattoolowkey.com/en/privacy-policy" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Last updated: 27 November 2026
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            This is a translation for information purposes. If there is any discrepancy, the{" "}
            <Link to={ROUTES.es.privacy} className="underline underline-offset-2 hover:text-foreground">
              Spanish version
            </Link>{" "}
            prevails.
          </p>
        </header>

        <Section title="1. Data Controller">
          <p><B>Controller:</B> Pablo Matos Rodríguez (trading as Lowkey Tattoo)</p>
          <p><B>Tax ID (NIF):</B> 54050691R</p>
          <p><B>Address:</B> Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife · Canary Islands, Spain</p>
          <p><B>Email:</B> <Mail /></p>
          <p>
            <B>Phone:</B>{" "}
            <a href="tel:+34685314986" className="hover:text-foreground transition-colors">+34 685 314 986</a>
          </p>
          <p>
            This policy explains how we process your personal data in accordance with Regulation (EU)
            2016/679 (GDPR) and Spanish Organic Law 3/2018 on the Protection of Personal Data and
            Guarantee of Digital Rights (LOPDGDD).
          </p>
        </Section>

        <Section title="2. What Data We Process">
          <p><B>a) Data you give us through the website:</B></p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <B>Booking form:</B> name, phone, email, chosen service and artist, preferred date, body
              area, a description of what you would like and whether it is your first time.
            </li>
            <li>
              <B>Contact form:</B> name, email or phone and your message.
            </li>
            <li>
              <B>Browsing data:</B> only if you accept the relevant cookies (see the{" "}
              <Link to={r.cookies} className="underline underline-offset-2 hover:text-foreground">
                Cookie Policy
              </Link>).
            </li>
          </ul>
          <p><B>b) Data we process at the studio (not through the website):</B></p>
          <p>
            When you get a tattoo, piercing or laser treatment, you sign an <B>informed consent</B>{" "}
            form at the studio that includes your identification details, your signature and a{" "}
            <B>health questionnaire</B> (for example, allergies, skin or blood-borne diseases,
            pregnancy or medication). Health data is a special category of data (art. 9 GDPR) and is
            processed with the safeguards described in section 4. If you are a minor, we also process
            the data of your legal representative.
          </p>
          <p>
            As a client, we also keep the history of your sessions and the data needed for invoicing.
          </p>
        </Section>

        <Section title="3. Purposes and Legal Basis">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <B>Handling your booking request or message</B> and contacting you to confirm it: steps
              taken at your request prior to entering into a contract (art. 6.1.b GDPR).
            </li>
            <li>
              <B>Providing the service</B> and managing our relationship with you (schedule, session
              history, reminders about your appointment): performance of a contract (art. 6.1.b GDPR).
            </li>
            <li>
              <B>Informed consent and health questionnaire:</B> assessing whether the service can be
              performed safely and complying with the health and hygiene regulations that apply to
              tattoo and piercing studios. Basis: your explicit consent (art. 9.2.a GDPR) and
              compliance with legal obligations (art. 6.1.c GDPR).
            </li>
            <li>
              <B>Invoicing and accounting and tax obligations:</B> legal obligation (art. 6.1.c GDPR).
            </li>
            <li>
              <B>Web analytics, advertising and external content (non-essential cookies):</B> your
              consent (art. 6.1.a GDPR), which you can withdraw at any time from "Cookie settings" in
              the footer.
            </li>
          </ul>
          <p>
            We do not make automated decisions or create profiles with legal effects on you. You are
            not obliged to give us your data, but without the fields marked as required we cannot
            handle your request or provide the service.
          </p>
        </Section>

        <Section title="4. Health Data: Additional Safeguards">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>It is only collected at the studio, at the time of the service, and never through the website.</li>
            <li>
              It can only be viewed by the studio owners and the artist who treats you, from a private
              area protected by username and password. If you come back to the studio with a different
              artist, that artist will also be able to see your history, to assess your safety.
            </li>
            <li>
              Signed consent forms cannot be modified or deleted. If one contains an error, it is
              annulled (it is kept, marked as annulled) and a new one is signed.
            </li>
            <li>
              It is kept in private, access-controlled storage on servers located in the European
              Union, and it travels encrypted (HTTPS).
            </li>
            <li>It is not used for commercial purposes or disclosed to third parties, except where required by law.</li>
            <li>It is kept only for the minimum period required by law (section 5).</li>
          </ul>
          <p>
            If you send us information about your health via WhatsApp or social media (for example, a
            reaction after your tattoo), we will use it only to help you and will record anything
            relevant in your client file. Please do not send more information than necessary through
            those channels.
          </p>
        </Section>

        <Section title="5. Retention Period">
          <p>We keep your data only for the minimum time necessary or required by law:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <B>Booking requests and contact messages sent through the website:</B> deleted
              automatically after 12 months. If you become a client, your data moves to your client
              file (next point).
            </li>
            <li>
              <B>Informed consent forms and health questionnaires:</B> at least 5 years from each
              procedure, as required by Canary Islands health regulations (Decree 154/2004).
            </li>
            <li>
              <B>Client file and session history:</B> while you remain a client and, after that, 5
              years from your last session, to deal with any possible legal liabilities.
            </li>
            <li>
              <B>Invoicing data:</B> for the periods set by tax and commercial law.
            </li>
            <li>
              <B>Cookies:</B> according to the periods stated in the{" "}
              <Link to={r.cookies} className="underline underline-offset-2 hover:text-foreground">
                Cookie Policy
              </Link>
              . Your cookie choice is remembered for 12 months.
            </li>
          </ul>
          <p>
            Once a year we review data that has exceeded these periods and delete it or, where the law
            requires, block it for the limitation period of any possible liabilities (art. 32
            LOPDGDD) before deleting it.
          </p>
        </Section>

        <Section title="6. Recipients and Data Processors">
          <p>
            We do not sell your data or share it with third parties for commercial purposes. We only
            disclose it to public authorities, courts and tribunals when required by law. To operate,
            we use the following providers, which process data on our behalf as data processors:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><B>Supabase Inc.</B>: database and file storage (servers in the EU, Stockholm).</li>
            <li><B>Vercel Inc.</B>: website hosting.</li>
            <li><B>Brevo (Sendinblue SAS, France)</B>: sending confirmation and notification emails.</li>
            <li><B>CallMeBot</B>: internal WhatsApp notifications to the team when a new request comes in. The notification only shows the service, the artist, the requested date and a reference number; it does not include your personal data.</li>
            <li><B>Google</B>: Google Calendar (internal schedule). In addition, only if you give your consent: Google Analytics and Google Maps.</li>
            <li><B>Meta Platforms Ireland Ltd.</B>: Meta Pixel, only if you give your consent.</li>
            <li><B>Elfsight Inc.</B>: displays the embedded Instagram feed, only if you accept external content.</li>
          </ul>
          <p>
            If you write to us via WhatsApp, Instagram or Facebook, those platforms also process your
            data under their own privacy policies.
          </p>
        </Section>

        <Section title="7. International Transfers">
          <p>
            Some providers (Google, Meta, Vercel and Elfsight) may process data outside the European
            Economic Area, especially in the USA. These transfers are covered by the EU-US Data
            Privacy Framework (European Commission adequacy decision of 10 July 2023) or, failing
            that, by the standard contractual clauses approved by the European Commission.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>You can exercise the following rights at any time:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><B>Access:</B> find out what data of yours we process.</li>
            <li><B>Rectification:</B> correct inaccurate data.</li>
            <li><B>Erasure:</B> ask us to delete your data when it is no longer needed.</li>
            <li><B>Objection:</B> object to a specific processing.</li>
            <li><B>Restriction:</B> ask us to restrict processing in certain cases.</li>
            <li><B>Portability:</B> receive your data in a structured format.</li>
            <li>
              <B>Withdraw your consent</B> at any time. Withdrawal does not affect the lawfulness of
              earlier processing.
            </li>
          </ul>
          <p>
            To exercise them, write to <Mail /> or send a letter to our address, stating which right
            you wish to exercise. If we cannot identify you, we may ask you to prove your identity. We
            will reply within one month at the latest.
          </p>
          <p>
            If you believe we have not handled your request properly, you can file a complaint with
            the <B>Spanish Data Protection Agency (AEPD)</B> at{" "}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              www.aepd.es
            </a>.
          </p>
        </Section>

        <Section title="9. Minors">
          <p>
            We do not perform tattoos, piercings or laser treatments on anyone under 16. Between 16
            and 17, only in the presence of, and with the signed authorisation of, their father,
            mother or legal representative, whose data we also process for this purpose.
          </p>
          <p>
            The forms on this website are intended for adults. Children under 14 may not give us
            their data without the consent of their parents or guardians (art. 7 LOPDGDD).
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            We apply technical and organisational measures appropriate to the risk to protect your
            data against unauthorised access, loss or destruction. These include encryption in
            transit (HTTPS), access control by user and role in the database, private storage of
            signed documents, which cannot be modified or deleted from the internal area, and access
            to the internal area only with authentication.
          </p>
        </Section>

        <Section title="11. Changes to this Policy">
          <p>
            We may update this policy to adapt it to legal or service changes. The date of the last
            update is shown at the top of the page.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to={r.legal} className="hover:text-foreground transition-colors mr-6">
            Legal Notice
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
