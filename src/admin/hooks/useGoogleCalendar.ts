import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end:   { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
  htmlLink?: string;
}

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function callCalendarFunction(
  method: string,
  params?: Record<string, string>,
  body?: object,
): Promise<unknown> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar${qs}`, {
    method,
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar function error ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── List events for a date range ─────────────────────────────────────────────

export function useCalendarEvents(timeMin: string, timeMax: string) {
  return useQuery({
    queryKey: ["calendar-events", timeMin, timeMax],
    queryFn: async () => {
      const data = await callCalendarFunction("GET", { timeMin, timeMax }) as { items?: CalendarEvent[] };
      return (data?.items ?? []) as CalendarEvent[];
    },
    enabled: !!timeMin && !!timeMax,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Create event ─────────────────────────────────────────────────────────────

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, "id" | "htmlLink">) => {
      const data = await callCalendarFunction("POST", undefined, event) as CalendarEvent;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}

// ── Delete event ─────────────────────────────────────────────────────────────

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await callCalendarFunction("DELETE", { eventId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}

// ── Build event object from a web booking ────────────────────────────────────

export function buildBookingEvent(params: {
  clientName: string;
  serviceLabel: string;
  date: string;       // yyyy-MM-dd
  time?: string | null; // HH:mm
  notes?: string | null;
  bodyZone?: string | null;
  phone?: string | null;
}): Omit<CalendarEvent, "id" | "htmlLink"> {
  const { clientName, serviceLabel, date, time, notes, bodyZone, phone } = params;

  const startDate = time ? `${date}T${time}:00` : date;
  const endDate   = time
    ? `${date}T${time.replace(/(\d+):(\d+)/, (_, h, m) => {
        const end = new Date(0, 0, 0, parseInt(h) + 1, parseInt(m));
        return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      })}:00`
    : date;

  const descParts: string[] = [];
  if (phone)    descParts.push(`📞 ${phone}`);
  if (bodyZone) descParts.push(`📍 Zona: ${bodyZone}`);
  if (notes)    descParts.push(`📝 ${notes}`);

  const eventBase = {
    summary: `${serviceLabel} — ${clientName}`,
    description: descParts.join("\n") || undefined,
    location: "Calle Dr. Allart, 50, Santa Cruz de Tenerife",
  };

  if (time) {
    return {
      ...eventBase,
      start: { dateTime: startDate, timeZone: "Atlantic/Canary" },
      end:   { dateTime: endDate,   timeZone: "Atlantic/Canary" },
    };
  }

  return {
    ...eventBase,
    start: { date: startDate },
    end:   { date: endDate },
  };
}
