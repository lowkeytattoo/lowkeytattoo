import { Helmet } from "react-helmet-async";
import { useI18n } from "@web/i18n/I18nProvider";

const SITE = "https://tattoolowkey.com";
const BANNER = `${SITE}/Banner_lowkeytattoo.jpg`;

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  schema?: object | object[];
}

export function SEOHead({ title, description, canonical, ogType = "website", ogImage, schema }: SEOHeadProps) {
  const { locale } = useI18n();
  const url = `${SITE}${canonical}`;
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];
  const socialImage = ogImage ?? BANNER;

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* hreflang — Spanish-only site, no separate EN URL exists */}
      <link rel="alternate" hrefLang="es" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="800" />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="es_ES" />

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
