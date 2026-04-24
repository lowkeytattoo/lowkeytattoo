import { Helmet } from "react-helmet-async";
import { useI18n } from "@web/i18n/I18nProvider";

const SITE = "https://tattoolowkey.com";
const BANNER = `${SITE}/og_banner.jpg`;

interface SEOHeadProps {
  title: string;
  description: string;
  /** Relative path for this page in the CURRENT locale (e.g. "/en/tattoos-tenerife") */
  canonical: string;
  /** Relative path for the SAME page in the OTHER locale (e.g. "/tatuajes-santa-cruz-tenerife") */
  alternateCanonical?: string;
  ogType?: string;
  ogImage?: string;
  schema?: object | object[];
}

export function SEOHead({
  title,
  description,
  canonical,
  alternateCanonical,
  ogType = "website",
  ogImage,
  schema,
}: SEOHeadProps) {
  const { locale } = useI18n();
  const url = `${SITE}${canonical}`;
  const altUrl = alternateCanonical ? `${SITE}${alternateCanonical}` : null;

  // Spanish URL is always the x-default (primary audience for this Tenerife studio)
  const esUrl = locale === "es" ? url : (altUrl ?? url);
  const enUrl = locale === "en" ? url : (altUrl ?? null);

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];
  const socialImage = ogImage ?? BANNER;

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* hreflang — proper alternate URLs for each language */}
      <link rel="alternate" hrefLang="es" href={esUrl} />
      {enUrl && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {/* x-default always points to the Spanish version */}
      <link rel="alternate" hrefLang="x-default" href={esUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1534" />
      <meta property="og:image:height" content="895" />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content={locale === "es" ? "es_ES" : "en_GB"} />
      {altUrl && (
        <meta
          property="og:locale:alternate"
          content={locale === "es" ? "en_GB" : "es_ES"}
        />
      )}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />

      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
