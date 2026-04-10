import { motion } from "framer-motion";
import { useI18n } from "@web/i18n/I18nProvider";
import { ARTISTS } from "@shared/config/artists";
import { ArtistCard } from "@web/components/Gallery";

const ArtistsSection = () => {
  const { t } = useI18n();

  return (
    <section id="artists" className="pt-8 pb-14 md:pt-10 md:pb-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-3">
            {t("gallery.artists.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-medium text-foreground">
            {t("gallery.artists.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ARTISTS.map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default ArtistsSection;
