import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@web/i18n/I18nProvider";
import { ARTISTS, Artist } from "@shared/config/artists";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { trackCategorySelect, trackArtistView, trackIgClick } from "@web/lib/analytics";

import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import igImg1 from "@/assets/IG/SaveClip.App_615062682_18548918890057477_6192388232569777066_n.jpg";
import igImg2 from "@/assets/IG/SaveClip.App_628262139_18313589008268610_5858521223976194281_n.jpg";
import laserImg from "@/assets/laser_lowkey.jpg";

type Category = "tattoo" | "piercing" | "laser";

const ARTIST_WORKS: Record<string, string[]> = {
  pablo:  [gallery1, gallery3, gallery6],
  sergio: [gallery2, gallery5, igImg1],
  fifo:   [gallery4, igImg2],
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
const ArtistCard = ({ artist, index }: { artist: Artist; index: number }) => {
  const { t } = useI18n();
  const works = ARTIST_WORKS[artist.id] ?? [];

  useEffect(() => { trackArtistView(artist.id, artist.name); }, [artist.id, artist.name]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col rounded-lg border border-border overflow-hidden bg-card"
    >
      {/* Photos */}
      <div className={`grid gap-0.5 ${works.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {works.map((src, i) => (
          <div
            key={i}
            className={`overflow-hidden ${works.length >= 3 && i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
          >
            <img
              src={src}
              alt={`${artist.name} ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 saturate-[0.8] hover:saturate-100"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-base font-medium text-foreground">{artist.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{artist.handle}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {artist.styles.map((s) => (
            <span key={s} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {s}
            </span>
          ))}
        </div>
        <a
          href={igUrl(artist.handle)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackIgClick(artist.handle, "gallery")}
          className="mt-1 inline-flex items-center gap-2 self-start rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wider transition-all duration-200 hover:border-muted-foreground hover:text-foreground"
        >
          <InstagramIcon size={13} />
          {t("gallery.artist.ig")}
        </a>
      </div>
    </motion.div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {[gallery4, igImg2].map((src, i) => (
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

const LaserView = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-2xl md:text-3xl font-medium text-foreground">
        {t("gallery.laser.title")}
      </h3>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-24 gap-3 text-center"
      >
        <p className="font-gothic text-4xl text-foreground">{t("gallery.laser.soon")}</p>
        <p className="font-mono text-xs text-muted-foreground max-w-xs leading-relaxed">
          {t("gallery.laser.desc")}
        </p>
      </motion.div>
    </div>
  );
};

// ── Main Gallery ─────────────────────────────────────────────────────────────
const Gallery = () => {
  const { t } = useI18n();
  const [active, setActive] = useState<Category | null>(null);

  return (
    <section id="gallery" className="py-14 md:py-20">
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
