import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface BirthdayInputProps {
  value: string;           // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function digitsToDisplay(digits: string): string {
  const d = digits.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string | null {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const day   = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year  = parseInt(digits.slice(4, 8), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  const date = new Date(year, month - 1, day);
  if (
    !isValid(date) ||
    date.getDate()     !== day   ||
    date.getMonth()    !== month - 1 ||
    date.getFullYear() !== year
  ) return null;
  return format(date, "yyyy-MM-dd");
}

export function BirthdayInput({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  className,
}: BirthdayInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));
  const [error, setError]     = useState(false);

  useEffect(() => {
    setDisplay(isoToDisplay(value));
    setError(false);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits    = e.target.value.replace(/\D/g, "");
    const formatted = digitsToDisplay(digits);
    setDisplay(formatted);
    setError(false);

    if (digits.length === 0) {
      onChange("");
    } else if (digits.length === 8) {
      const iso = displayToIso(formatted);
      if (iso) {
        onChange(iso);
      } else {
        onChange("");
        setError(true);
      }
    } else {
      onChange("");
    }
  };

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={10}
        className={cn(
          "flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
          error ? "border-destructive focus:ring-destructive" : "border-border",
          className,
        )}
      />
      {error && (
        <p className="mt-1 text-[11px] text-destructive">Fecha no válida</p>
      )}
    </div>
  );
}
