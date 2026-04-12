import { isSunday, isSaturday, isPast, startOfDay, format, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { useArtistBusyDays } from "@web/hooks/useCalendarAvailability";
import { isHoliday } from "@shared/config/holidays";
import { Artist } from "@shared/config/artists";
import { useI18n } from "@web/i18n/I18nProvider";
import { cn } from "@shared/lib/utils";

interface DateTimeStepProps {
  artist: Artist;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const DateTimeStep = ({
  artist,
  selectedDate,
  onDateChange,
  onContinue,
  onBack,
}: DateTimeStepProps) => {
  const { t, locale } = useI18n();
  const { blockedDays, partialDays, isLoading } = useArtistBusyDays(artist.calendarId || null);

  const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

  const isDisabled = (date: Date) => {
    if (isPast(startOfDay(date)) && !isToday(date)) return true;
    if (isSaturday(date) || isSunday(date)) return true;
    if (isHoliday(date)) return true;
    if (blockedDays.has(dateKey(date))) return true;
    return false;
  };

  const isToday = (date: Date) =>
    startOfDay(date).getTime() === startOfDay(new Date()).getTime();

  // Custom day rendering to show partial indicator
  const modifiers = {
    partial: (date: Date) => partialDays.has(dateKey(date)) && !blockedDays.has(dateKey(date)),
  };

  const modifiersClassNames = {
    partial: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-amber-400",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.12em] uppercase mb-1">
          {t("booking.step2.label")}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{t("booking.step2.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("booking.step2.subtitle")}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {isLoading && (
          <p className="text-xs font-mono text-muted-foreground animate-pulse">
            {t("booking.step2.loadingCalendar")}
          </p>
        )}

        <Calendar
          mode="single"
          selected={selectedDate ?? undefined}
          onSelect={(day) => onDateChange(day ?? null)}
          disabled={isDisabled}
          fromDate={new Date()}
          toDate={addMonths(new Date(), 3)}
          locale={locale === "es" ? es : undefined}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border border-border bg-card p-2"
        />

        {/* Legend */}
        {artist.calendarId && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-muted opacity-50" />
              {t("booking.step2.legend.blocked")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-card border border-border relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-amber-400" />
              {t("booking.step2.legend.partial")}
            </span>
          </div>
        )}

        {selectedDate && (
          <p className="text-sm text-foreground">
            {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: locale === "es" ? es : undefined })}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-sm border border-border bg-transparent text-xs font-mono text-muted-foreground uppercase tracking-[0.1em] px-4 py-2.5 hover:border-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {t("booking.back")}
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedDate}
          className={cn(
            "flex-1 cta-button rounded-sm text-xs tracking-[0.1em] uppercase",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          {t("booking.continue")}
        </button>
      </div>
    </div>
  );
};
