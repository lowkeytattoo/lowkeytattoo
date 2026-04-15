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
        <div className="relative">

          {/* ── Year picker overlay ── */}
          {yearPickerOpen && (
            <div className="absolute inset-x-0 bottom-full mb-1 z-20 bg-card border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={cn(
                    "w-full py-1.5 text-sm text-center hover:bg-muted transition-colors",
                    year === calendarMonth.getFullYear() && "text-primary font-semibold"
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
          )}

          {/* ── Calendar with custom caption ── */}
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
                      onClick={() => setYearPickerOpen((o) => !o)}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
