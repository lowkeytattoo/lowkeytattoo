import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerInputProps {
  value: string;           // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  fromYear?: number;
  toYear?: number;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  fromYear = 1920,
  toYear = new Date().getFullYear() + 2,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  const calendarMonth = month ?? selected ?? new Date();

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => toYear - i   // newest first
  );

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setYearPickerOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm",
            "hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span>
            {selected ? format(selected, "d 'de' MMMM yyyy", { locale: es }) : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
        {/*
          The Calendar always renders so the popover size never changes.
          The year picker overlays it with absolute inset-0, preventing
          any repositioning by Radix on open/close.
        */}
        <div className="relative">
          <Calendar
            mode="single"
            selected={selected}
            month={calendarMonth}
            onMonthChange={setMonth}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
                setYearPickerOpen(false);
              }
            }}
            locale={es}
            weekStartsOn={1}
            initialFocus
            components={{
              Caption: ({ displayMonth: dm }) => (
                <div className="flex items-center justify-between px-1 pt-1 pb-0">
                  <button
                    type="button"
                    aria-label="Mes anterior"
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    onClick={() => setMonth(new Date(dm.getFullYear(), dm.getMonth() - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 text-sm font-medium select-none">
                    <span className="capitalize">
                      {format(dm, "MMMM", { locale: es })}
                    </span>
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold tabular-nums"
                      onClick={() => setYearPickerOpen(true)}
                    >
                      {format(dm, "yyyy")}
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label="Mes siguiente"
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    onClick={() => setMonth(new Date(dm.getFullYear(), dm.getMonth() + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ),
            }}
          />

          {/* Year picker — absolute overlay, same size as calendar, no layout shift */}
          {yearPickerOpen && (
            <div className="absolute inset-0 bg-card rounded-md flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-sm font-medium capitalize">
                  {format(calendarMonth, "MMMM yyyy", { locale: es })}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  onClick={() => setYearPickerOpen(false)}
                >
                  ✕
                </button>
              </div>
              {/* overscroll-contain keeps wheel events inside this div */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain p-2"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-3 gap-1">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={cn(
                        "rounded py-1.5 text-sm text-center hover:bg-muted transition-colors tabular-nums",
                        year === calendarMonth.getFullYear() &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      )}
                      onClick={() => {
                        const next = new Date(calendarMonth);
                        next.setFullYear(year);
                        setMonth(next);
                        setYearPickerOpen(false);
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
