import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { ARTISTS, Artist } from "@shared/config/artists";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { trackCategorySelect, trackArtistView, trackIgClick } from "@web/lib/analytics";
import { useBooking } from "@web/contexts/BookingContext";
import { CONTACT } from "@web/config/contact";

import gallery1 from "@/assets/gallery-1.webp";
import gallery2 from "@/assets/gallery-2.webp";
import gallery3 from "@/assets/gallery-3.webp";
import gallery4 from "@/assets/gallery-4.webp";
import gallery5 from "@/assets/gallery-5.webp";
import gallery6 from "@/assets/gallery-6.webp";
import laserImg from "@/assets/laser_lowkey.webp";
import pabloImg from "@/assets/pablo_lowkey_tattoo_tenerife.webp";
import sergioImg from "@/assets/sergio_lowkey_tattoo_tenerife.webp";
import fifoImg from "@/assets/fifo_lowkey_tattoo_tenerife.webp";

type Category = "tattoo" | "piercing" | "laser";

const ARTIST_WORKS: Record<string, string[]> = {
  pablo:  [gallery1, gallery3, gallery6],
  sergio: [gallery2, gallery5, gallery6],
  fifo:   [gallery4, gallery3],
};

const ARTIST_PHOTO: Record<string, string> = {
  pablo:  pabloImg,
  sergio: sergioImg,
  fifo:   fifoImg,
};

const CATEGORIES: { id: Category; labelKey: string; bg: string | null }[] = [
  { id: "tattoo",   labelKey: "gallery.cat.tattoo",  bg: gallery2 },
  { id: "piercing", labelKey: "gallery.cat.piercing", bg: gallery4 },
  { id: "laser",    labelKey: "gallery.cat.laser",    bg: laserImg },
];

const igUrl = (handle: string) =>
  `https://www.instagram.com/${handle.replace("@", "")}/`;

// ── Transition config ────────────────────────────────────────────────────────
const fadeSlide = {
  initial:  { opacity: 0, y: 18 },
  animate:  { opacity: 1, y: 0  },
  exit:     { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

// ── Artist card ──────────────────────────────────────────────────────────────
export const ArtistCard = ({ artist, index }: { artist: Artist; index: number }) => {
  const photo = ARTIST_PHOTO[artist.id];
  const works = ARTIST_WORKS[artist.id] ?? [];
  const igHref = igUrl(artist.handle);

  useEffect(() => { trackArtistView(artist.id, artist.name); }, [artist.id, artist.name]);

  return (
    <motion.a
      href={igHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackIgClick(artist.handle, "gallery")}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="group flex flex-col rounded-lg border border-border overflow-hidden bg-card hover:border-muted-foreground transition-colors duration-200"
    >
      {/* Artist photo */}
      <div className="aspect-[4/3] w-full relative overflow-hidden">
        <img
          src={photo ?? works[0]}
          alt={artist.name}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-between gap-3 p-5 flex-1 min-w-0">
        <div>
          <p className="text-base font-medium text-foreground">{artist.name}</p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{artist.handle}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {artist.styles.map((s) => (
            <span key={s} className="rounded-sm bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              {s}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-2 self-start font-mono text-[11px] text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors duration-200">
          <InstagramIcon size={13} />
          Ver Instagram →
        </span>
      </div>
    </motion.a>
  );
};

// ── Category detail views ────────────────────────────────────────────────────
const TattooView = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-2xl md:text-3xl font-medium text-foreground">
        {t("gallery.artists.title")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ARTISTS.map((artist, i) => (
          <ArtistCard key={artist.id} artist={artist} index={i} />
        ))}
      </div>
    </div>
  );
};

const PiercingView = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-2xl md:text-3xl font-medium text-foreground">
        {t("gallery.piercing.title")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {[gallery4, gallery3].map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="aspect-square overflow-hidden rounded-lg"
          >
            <img src={src} alt={`Piercing ${i + 1}`} className="h-full w-full object-cover gallery-image rounded-lg" loading="lazy" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LaserArtistCard = ({ artist }: { artist: Artist }) => {
  const photo = ARTIST_PHOTO[artist.id];
  const igHref = igUrl(artist.handle);

  useEffect(() => { trackArtistView(artist.id, artist.name); }, [artist.id, artist.name]);

  return (
    <motion.a
      href={igHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackIgClick(artist.handle, "gallery")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group flex flex-col rounded-lg border border-border overflow-hidden bg-card w-full hover:border-muted-foreground transition-colors duration-200"
    >
      {/* Artist photo */}
      {photo && (
        <div className="aspect-[4/3] w-full relative overflow-hidden">
          <img
            src={photo}
            alt={artist.name}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col justify-between gap-3 p-5 flex-1 min-w-0">
        <div>
          <p className="text-base font-medium text-foreground">{artist.name}</p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{artist.handle}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {artist.styles.map((s) => (
            <span key={s} className="rounded-sm bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              {s}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-2 self-start font-mono text-[11px] text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors duration-200">
          <InstagramIcon size={13} />
          Ver Instagram →
        </span>
      </div>
    </motion.a>
  );
};

const LaserView = () => {
  const { t } = useI18n();
  const { openModal } = useBooking();
  const laserArtists = ARTISTS.filter((a) => a.laser);

  return (
    <div className="flex flex-col gap-8">

      {/* Hero info block */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center gap-4 py-6"
      >
        <h3 className="text-3xl md:text-5xl font-medium text-foreground leading-tight">
          {t("gallery.laser.title")}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
          {t("gallery.laser.desc")}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <button
            onClick={openModal}
            className="cta-button rounded-sm font-mono text-xs tracking-[0.1em] uppercase px-6 py-3 w-full sm:w-auto"
          >
            {t("service.book.online")}
          </button>
          <a
            href={`${CONTACT.whatsapp}?text=${encodeURIComponent("Hola, me gustaría información sobre eliminación láser de tatuajes.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 font-mono text-xs text-foreground tracking-wide hover:border-foreground transition-colors duration-200 w-full sm:w-auto"
          >
            <WhatsAppIcon size={13} />
            WhatsApp
          </a>
        </div>

        <a
          href="/laser-eliminacion-tatuajes-tenerife"
          className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] hover:text-foreground transition-colors duration-200"
        >
          {t("gallery.laser.cta")} →
        </a>
      </motion.div>

      {/* Artist cards */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {laserArtists.map((artist) => (
          <div key={artist.id} className="w-full sm:max-w-md">
            <LaserArtistCard artist={artist} />
          </div>
        ))}
      </div>

    </div>
  );
};

// ── Main Gallery ─────────────────────────────────────────────────────────────
const Gallery = () => {
  const { t } = useI18n();
  const [active, setActive] = useState<Category | null>(null);

  return (
    <section id="gallery" className="pt-8 pb-10 md:pt-10 md:pb-14">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-3">
            {t("gallery.label")}
          </p>

          {/* Title row: back button appears when a category is open */}
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {active && (
                <motion.button
                  key="back"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setActive(null)}
                  className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
                >
                  <ArrowLeft size={14} />
                  {t("gallery.back")}
                </motion.button>
              )}
            </AnimatePresence>
            <h2 className="text-3xl md:text-4xl font-medium text-foreground">
              {active ? t(`gallery.cat.${active}`) : t("gallery.title")}
            </h2>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!active ? (
            /* ── 3 category cards ── */
            <motion.div key="cards" {...fadeSlide} className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  onClick={() => { trackCategorySelect(cat.id); setActive(cat.id); }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  className="group relative aspect-[16/9] sm:aspect-[3/4] w-full overflow-hidden rounded-lg border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cat.bg ? (
                    <img
                      src={cat.bg}
                      alt={t(cat.labelKey)}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.65] group-hover:saturate-100"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-background/10 transition-opacity duration-300 group-hover:from-background/60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-7 gap-1.5">
                    <span className="font-gothic text-3xl sm:text-4xl md:text-5xl text-foreground leading-none drop-shadow-lg">
                      {t(cat.labelKey)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                      Ver →
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            /* ── Detail view ── */
            <motion.div key={active} {...fadeSlide}>
              {active === "tattoo"   && <TattooView />}
              {active === "piercing" && <PiercingView />}
              {active === "laser"    && <LaserView />}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

export default Gallery;
