import { isSunday, isSaturday, isPast, startOfDay } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarAvailability, TimeSlot } from "@web/hooks/useCalendarAvailability";
import { Artist } from "@shared/config/artists";
import { useI18n } from "@web/i18n/I18nProvider";
import { cn } from "@shared/lib/utils";

interface DateTimeStepProps {
  artist: Artist;
  selectedDate: Date | null;
  selectedSlot: TimeSlot | null;
  onDateChange: (date: Date | null) => void;
  onSlotChange: (slot: TimeSlot) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const DateTimeStep = ({
  artist,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  onContinue,
  onBack,
}: DateTimeStepProps) => {
  const { t } = useI18n();
  const { slots, isLoading, calendarUnavailable } = useCalendarAvailability(
    artist.calendarId,
    selectedDate
  );

  const isDisabled = (date: Date) => {
    return isSunday(date) || isSaturday(date) || isPast(startOfDay(date)) && !isToday(date);
  };

  const isToday = (date: Date) => {
    const today = startOfDay(new Date());
    return startOfDay(date).getTime() === today.getTime();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.12em] uppercase mb-1">
          {t("booking.step2.label")}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{t("booking.step2.title")}</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(day) => {
              onDateChange(day ?? null);
            }}
            disabled={isDisabled}
            fromDate={new Date()}
            className="rounded-md border border-border bg-card p-2"
          />
        </div>

        {/* Time slots */}
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {t("booking.step2.slots")}
          </p>

          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">{t("booking.step2.selectDay")}</p>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onSlotChange(slot)}
                  disabled={!slot.available}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-mono transition-all duration-150",
                    slot.available
                      ? selectedSlot?.time === slot.time
                        ? "border-foreground bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-muted-foreground"
                      : "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}

          {calendarUnavailable && selectedDate && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 mt-1">
              <AlertCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{t("booking.step2.unavailable")}</p>
            </div>
          )}
        </div>
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
          disabled={!selectedDate || !selectedSlot}
          className="flex-1 cta-button rounded-sm text-xs tracking-[0.1em] uppercase disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {t("booking.continue")}
        </button>
      </div>
    </div>
  );
};
