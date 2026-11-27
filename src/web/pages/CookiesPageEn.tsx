import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { useCookieConsent } from "@web/contexts/CookieConsentContext";
import { ROUTES } from "@web/config/routes";

// English translation of CookiesPage.tsx. Keep both in sync (including the
// cookie tables) whenever a tag is added or removed.

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
          <th className="text-left p-2 border-b border-border">Name</th>
          <th className="text-left p-2 border-b border-border">Owner</th>
          <th className="text-left p-2 border-b border-border">Purpose</th>
          <th className="text-left p-2 border-b border-border">Duration</th>
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
  { name: "lowkey-consent", owner: "Lowkey Tattoo (first-party)", purpose: "Stores your cookie preferences. Browser local storage.", duration: "12 months" },
  { name: "lowkey-lang", owner: "Lowkey Tattoo (first-party)", purpose: "Remembers the language (Spanish / English) you have chosen.", duration: "12 months" },
  { name: "lowkey-internal", owner: "Lowkey Tattoo (first-party)", purpose: "Staff devices only: excludes their visits from the statistics.", duration: "Persistent" },
  { name: "sb-*-auth-token", owner: "Lowkey Tattoo (first-party, via Supabase)", purpose: "Staff private area only: keeps the session signed in.", duration: "Until sign-out" },
];

const ANALYTICS: CookieRow[] = [
  { name: "_ga", owner: "Google Ireland Ltd.", purpose: "Distinguishes visitors using a random identifier to produce usage statistics.", duration: "2 years" },
  { name: "_ga_<ID>", owner: "Google Ireland Ltd.", purpose: "Maintains the session state in Google Analytics 4.", duration: "2 years" },
];

const MARKETING: CookieRow[] = [
  { name: "_fbp", owner: "Meta Platforms Ireland Ltd.", purpose: "Measures the effectiveness of Meta (Facebook / Instagram) ads.", duration: "3 months" },
  { name: "fr", owner: "Meta Platforms Ireland Ltd.", purpose: "Shows and measures ads on Facebook and Instagram (facebook.com domain).", duration: "3 months" },
];

const EXTERNAL: CookieRow[] = [
  { name: "NID and others", owner: "Google Ireland Ltd.", purpose: "Set by the embedded Google Maps map (google.com domain) to remember preferences and for Google's own purposes.", duration: "Up to 6 months" },
  { name: "Elfsight local storage", owner: "Elfsight Inc.", purpose: "Displays our embedded Instagram feed and stores technical widget data.", duration: "Persistent (until you delete it)" },
];

const r = ROUTES.en;

export default function CookiesPageEn() {
  const { openSettings } = useCookieConsent();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Cookie Policy | Lowkey Tattoo</title>
        <meta
          name="description"
          content="Lowkey Tattoo cookie policy: which cookies we use, what they are for, how long they last and how to manage them."
        />
        <link rel="canonical" href="https://tattoolowkey.com/en/cookie-policy" />
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Last updated: 27 November 2026
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            This is a translation for information purposes. If there is any discrepancy, the{" "}
            <Link to={ROUTES.es.cookies} className="underline underline-offset-2 hover:text-foreground">
              Spanish version
            </Link>{" "}
            prevails.
          </p>
        </header>

        <Section title="1. What cookies are">
          <p>
            Cookies and similar technologies (such as the browser's local storage) are small files
            that a website stores on your device to remember information about your visit. This
            policy complies with art. 22.2 of Spanish Law 34/2002 (LSSI-CE) and follows the Spanish
            Data Protection Agency's Guide on the use of cookies.
          </p>
        </Section>

        <Section title="2. How to manage your preferences">
          <p>
            Non-essential cookies <B>are only enabled if you accept them</B>. You can accept them all,
            reject them all or choose by purpose, and <B>change or withdraw your consent at any
            time</B> as easily as you gave it:
          </p>
          <button
            type="button"
            onClick={openSettings}
            className="font-mono text-xs tracking-[0.1em] uppercase border border-foreground/60 text-foreground px-4 py-2 rounded-sm hover:bg-foreground hover:text-background transition-colors duration-200"
          >
            Cookie settings
          </button>
          <p>
            This button is also always available in the footer. If you withdraw a consent you had
            given, we delete the tracking cookies on our domain and reload the page. Your choice is
            remembered for 12 months; after that we will ask you again.
          </p>
          <p>
            You can also block or delete cookies from your browser settings:{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>,{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>.
          </p>
        </Section>

        <Section title="3. Technical cookies (always active)">
          <p>
            They are necessary for the website to work and are exempt from consent. They are not used
            to track you.
          </p>
          <CookieTable rows={TECHNICAL} />
        </Section>

        <Section title="4. Analytics cookies (require consent)">
          <p>
            We use Google Analytics 4 to find out how many people visit the website and which pages
            they view. Google Analytics 4 does not store the full IP address, but it uses browser
            identifiers that make it possible to distinguish visits.
          </p>
          <CookieTable rows={ANALYTICS} />
        </Section>

        <Section title="5. Advertising cookies (require consent)">
          <p>
            They are used to measure the results of our campaigns on Meta (Facebook and Instagram)
            and to show you relevant ads. We use the Meta Pixel.
          </p>
          <CookieTable rows={MARKETING} />
        </Section>

        <Section title="6. External content (requires consent)">
          <p>
            The map in the contact section is provided by Google Maps and the Instagram feed is shown
            through Elfsight. Neither of them is loaded, and therefore no information is sent to those
            providers, until you accept this category or click "Load map" or "View Instagram feed".
          </p>
          <CookieTable rows={EXTERNAL} />
        </Section>

        <Section title="7. International transfers">
          <p>
            Google, Meta and Elfsight may process the data obtained through their cookies outside the
            European Economic Area, especially in the USA, under the EU-US Data Privacy Framework. You
            can read their policies at{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>{" "}
            and{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">facebook.com/privacy/policy</a>.
          </p>
        </Section>

        <Section title="8. More information">
          <p>
            To find out how we process your personal data and how to exercise your rights, see the{" "}
            <Link to={r.privacy} className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>{" "}
            or write to us at{" "}
            <a href="mailto:info@tattoolowkey.com" className="underline underline-offset-2 hover:text-foreground">
              info@tattoolowkey.com
            </a>.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <Link to={r.privacy} className="hover:text-foreground transition-colors mr-6">
            Privacy Policy
          </Link>
          <Link to={r.legal} className="hover:text-foreground transition-colors mr-6">
            Legal Notice
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
