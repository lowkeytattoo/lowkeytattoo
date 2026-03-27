import { useState, useEffect } from "react";
import { addHours, format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";

export interface TimeSlot {
  time: string;      // "11:00"
  label: string;     // "11:00 h"
  startISO: string;
  endISO: string;
  available: boolean;
}

interface BusyPeriod {
  start: string;
  end: string;
}

function generateSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 11; hour <= 17; hour++) {
    const start = setMinutes(setHours(startOfDay(date), hour), 0);
    const end = addHours(start, 1);
    slots.push({
      time: format(start, "HH:mm"),
      label: `${format(start, "HH:mm")} h`,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      available: true,
    });
  }
  return slots;
}

export function useCalendarAvailability(calendarId: string, date: Date | null) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dateKey = date ? date.toDateString() : null;

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
    const allSlots = generateSlots(date);

    if (!apiKey || !calendarId) {
      setSlots(allSlots);
      setCalendarUnavailable(true);
      return;
    }

    const controller = new AbortController();

    const fetchBusy = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const timeMin = startOfDay(date).toISOString();
        const timeMax = setHours(startOfDay(date), 23).toISOString();

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/freeBusy?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              timeMin,
              timeMax,
              items: [{ id: calendarId }],
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) throw new Error("Calendar API error");

        const data = await response.json();
        const busy: BusyPeriod[] = data.calendars?.[calendarId]?.busy ?? [];

        const filteredSlots = allSlots.map((slot) => {
          const slotStart = parseISO(slot.startISO);
          const slotEnd = parseISO(slot.endISO);
          const isBusy = busy.some((period) => {
            const busyStart = parseISO(period.start);
            const busyEnd = parseISO(period.end);
            return slotStart < busyEnd && slotEnd > busyStart;
          });
          return { ...slot, available: !isBusy };
        });

        setSlots(filteredSlots);
        setCalendarUnavailable(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setIsError(true);
        setSlots(allSlots);
        setCalendarUnavailable(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusy();
    return () => controller.abort();
  // dateKey is derived from date — using it avoids stale closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, dateKey]);

  return { slots, isLoading, isError, calendarUnavailable };
}
