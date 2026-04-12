import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Artist } from "@shared/config/artists";
import { useI18n } from "@web/i18n/I18nProvider";
import { cn } from "@shared/lib/utils";
import type { ServiceType } from "@shared/types/index";
import pabloImg  from "@/assets/pablo_lowkey_tattoo_tenerife.webp";
import sergioImg from "@/assets/sergio_lowkey_tattoo_tenerife.webp";
import fifoImg   from "@/assets/fifo_lowkey_tattoo_tenerife.webp";

const ARTIST_PHOTO: Record<string, string> = {
  pablo:  pabloImg,
  sergio: sergioImg,
  fifo:   fifoImg,
};

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  tattoo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
    </svg>
  ),
  piercing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  laser: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

interface ArtistStepProps {
  artists: Artist[];
  selected: Artist | null;
  selectedService: ServiceType | null;
  onSelect: (artist: Artist) => void;
  onServiceSelect: (service: ServiceType) => void;
  onContinue: () => void;
}

export const ArtistStep = ({
  artists,
  selected,
  selectedService,
  onSelect,
  onServiceSelect,
  onContinue,
}: ArtistStepProps) => {
  const { t } = useI18n();

  const isMultiService = (selected?.services.length ?? 0) > 1;
  const canContinue = !!selected && (!isMultiService || !!selectedService);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.12em] uppercase mb-1">
          {t("booking.step1.label")}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{t("booking.step1.title")}</h2>
      </div>

      <div className="flex flex-col gap-3">
        {artists.map((artist) => {
          const isSelected = selected?.id === artist.id;
          const showServices = isSelected && artist.services.length > 1;

          return (
            <Fragment key={artist.id}>
              <button
                onClick={() => onSelect(artist)}
                className={cn(
                  "flex items-center gap-4 rounded-md border p-4 text-left transition-all duration-200",
                  isSelected
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

              {/* Service selector expands directly below the selected artist's card */}
              <AnimatePresence initial={false}>
                {showServices && (
                  <motion.div
                    key="service-selector"
                    initial={{ opacity: 0, height: 0, marginTop: -8 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: -8 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-md border border-border bg-background px-3 pt-3 pb-3 flex flex-col gap-2.5">
                      <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em] uppercase">
                        {t("booking.step1.serviceTitle")}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {artist.services.map((service) => (
                          <button
                            key={service}
                            onClick={() => onServiceSelect(service)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-md border px-2 py-2.5 text-center transition-all duration-200",
                              selectedService === service
                                ? "border-foreground bg-secondary"
                                : "border-border bg-card hover:border-muted-foreground"
                            )}
                          >
                            <span className={cn(
                              "transition-colors duration-200",
                              selectedService === service ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {SERVICE_ICONS[service]}
                            </span>
                            <span className={cn(
                              "text-[10px] font-mono uppercase tracking-wider transition-colors duration-200",
                              selectedService === service ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {t(`booking.service.${service}`)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="cta-button rounded-sm text-xs tracking-[0.1em] uppercase w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {t("booking.continue")}
      </button>
    </div>
  );
};
