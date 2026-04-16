import { format } from "date-fns";
import type { Locale } from "date-fns";

/**
 * Formats a "yyyy-MM-dd" date string as local time.
 * Using `new Date(str)` alone parses as UTC and shifts the day in negative-offset
 * timezones (e.g. Canary Islands UTC-1); appending T00:00:00 forces local midnight.
 */
export function formatLocalDate(
  dateStr: string,
  dateFormat: string,
  options?: { locale?: Locale },
): string {
  return format(new Date(dateStr + "T00:00:00"), dateFormat, options);
}
