// Spanish national holidays + Canary Islands regional holidays
// Local (Santa Cruz de Tenerife) holidays should be added directly to Google Calendar as all-day events

const NATIONAL_2026 = [
  "2026-01-01", // Año Nuevo
  "2026-01-06", // Reyes Magos
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajo
  "2026-08-15", // Asunción
  "2026-10-12", // Fiesta Nacional
  "2026-11-01", // Todos los Santos
  "2026-12-06", // Día de la Constitución
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad
];

const CANARIAS_2026 = [
  "2026-05-30", // Día de Canarias
];

const NATIONAL_2027 = [
  "2027-01-01",
  "2027-01-06",
  "2027-03-26", // Viernes Santo
  "2027-05-01",
  "2027-08-15",
  "2027-10-12",
  "2027-11-01",
  "2027-12-06",
  "2027-12-08",
  "2027-12-25",
];

const CANARIAS_2027 = [
  "2027-05-30",
];

export const HOLIDAYS: ReadonlySet<string> = new Set([
  ...NATIONAL_2026,
  ...CANARIAS_2026,
  ...NATIONAL_2027,
  ...CANARIAS_2027,
]);

export function isHoliday(date: Date): boolean {
  const key = date.toISOString().slice(0, 10);
  return HOLIDAYS.has(key);
}
