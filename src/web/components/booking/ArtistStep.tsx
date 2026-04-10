import { Artist } from "@shared/config/artists";
import { useI18n } from "@web/i18n/I18nProvider";
import { cn } from "@shared/lib/utils";
import pabloImg  from "@/assets/pablo_lowkey_tattoo_tenerife.webp";
import sergioImg from "@/assets/sergio_lowkey_tattoo_tenerife.webp";
import fifoImg   from "@/assets/fifo_lowkey_tattoo_tenerife.webp";

const ARTIST_PHOTO: Record<string, string> = {
  pablo:  pabloImg,
  sergio: sergioImg,
  fifo:   fifoImg,
};

interface ArtistStepProps {
  artists: Artist[];
  selected: Artist | null;
  onSelect: (artist: Artist) => void;
  onContinue: () => void;
}

export const ArtistStep = ({ artists, selected, onSelect, onContinue }: ArtistStepProps) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.12em] uppercase mb-1">
          {t("booking.step1.label")}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{t("booking.step1.title")}</h2>
      </div>

      <div className="flex flex-col gap-3">
        {artists.map((artist) => (
          <button
            key={artist.id}
            onClick={() => onSelect(artist)}
            className={cn(
              "flex items-center gap-4 rounded-md border p-4 text-left transition-all duration-200",
              selected?.id === artist.id
                ? "border-foreground bg-secondary"
                : "border-border bg-card hover:border-muted-foreground"
            )}
          >
            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 bg-muted">
              {ARTIST_PHOTO[artist.id] ? (
                <img
                  src={ARTIST_PHOTO[artist.id]}
                  alt={artist.name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="font-gothic text-foreground text-lg leading-none">
                    {artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{artist.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{artist.handle}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {artist.styles.map((style) => (
                  <span
                    key={style}
                    className="inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onContinue}
        disabled={!selected}
        className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {t("booking.continue")}
      </button>
    </div>
  );
};
