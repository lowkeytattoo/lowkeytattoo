/** colorId de Google Calendar para eventos creados desde la app.
 *  Eventos manuales no llevan colorId → color base del calendario.
 */
export const CALENDAR_COLOR = {
  /** Sesión registrada desde EventActionPanel (SessionFromEventModal) */
  SESSION_FROM_EVENT: "2",    // Sage — verde salvia

  /** Reserva web confirmada y convertida en sesión (BookingToSessionModal) */
  SESSION_FROM_BOOKING: "7",  // Peacock — azul pavo real
} as const;

/** Mapeo de colorId de Google Calendar → clase Tailwind para la vista admin */
export const GOOGLE_COLOR_CLASS: Record<string, string> = {
  "1":  "bg-indigo-300/20 text-indigo-300 border-indigo-300/30",
  "2":  "bg-green-500/20 text-green-300 border-green-500/30",
  "3":  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "4":  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "5":  "bg-yellow-400/20 text-yellow-300 border-yellow-400/30",
  "6":  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "7":  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "8":  "bg-gray-500/20 text-gray-300 border-gray-500/30",
  "9":  "bg-blue-900/20 text-blue-200 border-blue-900/30",
  "10": "bg-green-800/20 text-green-200 border-green-800/30",
  "11": "bg-red-500/20 text-red-300 border-red-500/30",
};
