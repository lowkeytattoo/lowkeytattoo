/**
 * Short reference for a web request (first 8 hex chars of its id).
 * It appears in internal notices instead of client data and lets staff open
 * the request in the panel (/admin/bookings?ref=… or /admin/messages?ref=…).
 * It grants no access by itself: the panel requires login.
 */
export function refOf(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
