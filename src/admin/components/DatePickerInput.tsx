import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerInputProps {
  value: string;           // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span>
            {selected
              ? format(selected, "d 'de' MMMM yyyy", { locale: es })
              : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-card border-border"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            if (day) {
              onChange(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          defaultMonth={selected}
          locale={es}
          weekStartsOn={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
