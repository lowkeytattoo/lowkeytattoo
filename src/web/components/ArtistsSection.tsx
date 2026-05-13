import { useI18n } from "@web/i18n/I18nProvider";
import { ARTISTS, PUBLIC_ARTISTS } from "@shared/config/artists";
import { ArtistCard } from "@web/components/Gallery";

const ArtistsSection = () => {
  const { t } = useI18n();

  return (
    <section id="artists" className="pt-8 pb-14 md:pt-10 md:pb-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">

        <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-3">
            {t("gallery.artists.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-medium text-foreground">
            {t("gallery.artists.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PUBLIC_ARTISTS(ARTISTS).map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default ArtistsSection;
