import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@web/components/Navbar";
import Footer from "@web/components/Footer";
import { SEOHead } from "@web/components/SEOHead";
import { useI18n } from "@web/i18n/I18nProvider";
import { useBooking } from "@web/contexts/BookingContext";
import { ARTISTS } from "@shared/config/artists";
import { ROUTES } from "@web/config/routes";
import { ARTIST_WORKS, ARTIST_PHOTO } from "@web/components/Gallery";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { trackIgClick } from "@web/lib/analytics";

import fifoPro1 from "@/assets/pro/lowkey_tattoo_tenerife_fifo_pro_1.webp";
import fifoPro2 from "@/assets/pro/lowkey_tattoo_tenerife_fifo_pro_2.webp";
import fifoPro3 from "@/assets/pro/lowkey_tattoo_tenerife_fifo_pro_3.webp";
import fifoPro4 from "@/assets/pro/lowkey_tattoo_tenerife_fifo_pro_4.webp";
import fifoPro5 from "@/assets/pro/lowkey_tattoo_tenerife_fifo_pro_5.webp";
import sergioPro2 from "@/assets/pro/lowkey_tattoo_tenerife_sergio_pro_2.webp";
import sergioPro3 from "@/assets/pro/lowkey_tattoo_tenerife_sergio_pro_3.webp";
import sergioPro4 from "@/assets/pro/lowkey_tattoo_tenerife_sergio_pro_4.webp";

const ARTIST_PRO_PHOTOS: Record<string, string[]> = {
  pablo:  [],
  sergio: [sergioPro2, sergioPro3, sergioPro4],
  fifo:   [fifoPro1, fifoPro2, fifoPro3, fifoPro4, fifoPro5],
};

const igUrl = (handle: string) =>
  `https://www.instagram.com/${handle.replace("@", "")}/`;

export default function ArtistBioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const { openModal } = useBooking();

  const artist = ARTISTS.find((a) => a.slug === slug && !a.hidden);
  if (!artist) return <Navigate to={ROUTES[locale].home} replace />;

  const r    = ROUTES[locale];
  const rAlt = ROUTES[locale === "es" ? "en" : "es"];

  const [portrait, portraitS, portraitXS] = ARTIST_PHOTO[artist.id] ?? [];
  const works     = ARTIST_WORKS[artist.id] ?? [];
  const proPhotos = ARTIST_PRO_PHOTOS[artist.id] ?? [];
  const igHref    = igUrl(artist.handle);

  const title       = t(`artist.${artist.id}.meta.title`);
  const description = t(`artist.${artist.id}.meta.desc`);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={description}
        canonical={r.artist(artist.slug)}
        alternateCanonical={rAlt.artist(artist.slug)}
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        {/* Back */}
        <Link
          to={r.home + "#artists"}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          {t("artist.bio.back")}
        </Link>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-3">
              {t("gallery.artists.label")}
            </p>
            <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-2">
              {artist.name}
            </h1>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              {artist.handle}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {artist.styles.map((s) => (
                <span
                  key={s}
                  className="rounded-sm bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider"
                >
                  {s}
                </span>
              ))}
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              {t(`artist.${artist.id}.bio`)}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openModal}
                className="cta-button rounded-sm font-mono text-xs tracking-[0.1em] uppercase px-6 py-3"
              >
                {t("artist.bio.book")}
              </button>
              <a
                href={igHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackIgClick(artist.handle, "bio")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 font-mono text-xs text-foreground tracking-wide hover:border-foreground transition-colors duration-200"
              >
                <InstagramIcon size={13} />
                {t("artist.bio.viewIg")}
              </a>
            </div>
          </motion.div>

          {/* Portrait */}
          {portrait && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="aspect-[3/4] overflow-hidden rounded-lg order-first md:order-last"
            >
              <img
                src={portrait}
                srcSet={
                  portraitS
                    ? `${portraitXS} 400w, ${portraitS} 800w, ${portrait} 1200w`
                    : undefined
                }
                alt={locale === "es" ? `${artist.name} — tatuador en Lowkey Tattoo, Santa Cruz de Tenerife` : `${artist.name} — tattoo artist at Lowkey Tattoo, Santa Cruz de Tenerife`}
                className="h-full w-full object-cover object-top"
                width={600}
                height={800}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          )}
        </div>

        {/* ── Pro photo gallery ─────────────────────────────────────────── */}
        {proPhotos.length > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {proPhotos.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={src}
                    alt={locale === "es" ? `${artist.name} — Lowkey Tattoo, estudio de tatuajes en Santa Cruz de Tenerife` : `${artist.name} — Lowkey Tattoo, tattoo studio in Santa Cruz de Tenerife`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={400}
                    height={400}
                    sizes="(max-width: 480px) 45vw, (max-width: 1024px) 30vw, 300px"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Portfolio works ───────────────────────────────────────────── */}
        {works.length > 0 && (
          <section>
            <h2 className="text-2xl font-medium text-foreground mb-6">
              {t("artist.bio.portfolio")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {works.map(([src, srcS, srcXS], i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 6) * 0.06 }}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={src}
                    srcSet={`${srcXS} 400w, ${srcS} 800w, ${src} 1600w`}
                    alt={locale === "es" ? `${artist.name} — tatuaje en Santa Cruz de Tenerife` : `${artist.name} — tattoo in Santa Cruz de Tenerife`}
                    className="h-full w-full object-cover gallery-image"
                    loading="lazy"
                    width={400}
                    height={400}
                    sizes="(max-width: 480px) 45vw, (max-width: 1024px) 30vw, 300px"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
