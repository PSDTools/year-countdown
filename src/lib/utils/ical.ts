import ICAL from 'ical.js';
import type { CalendarEvent } from '$lib/types';

/**
 * Parse raw ICS text into a list of CalendarEvent objects.
 * Handles recurring events and returns them in chronological order.
 */
export function parseICS(icsText: string): CalendarEvent[] {
  let parsed: unknown[];
  try {
    parsed = ICAL.parse(icsText) as unknown[];
  } catch {
    console.error('Failed to parse ICS data');
    return [];
  }

  const vcalendar = new ICAL.Component(parsed);
  const vevents = vcalendar.getAllSubcomponents('vevent');
  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent);
      const summary = event.summary ?? '';
      const id = event.uid ?? `${summary}-${Date.now()}-${Math.random()}`;
      const description = vevent.getFirstPropertyValue('description') as string | null;
      const location = vevent.getFirstPropertyValue('location') as string | null;

      const dtstart = event.startDate;
      const dtend = event.endDate;

      if (!dtstart) continue;

      const start = dtstart.toJSDate();
      const end = dtend ? dtend.toJSDate() : start;
      const allDay = dtstart.isDate;

      events.push({
        id,
        summary,
        description: description ?? undefined,
        start,
        end,
        allDay,
        location: location ?? undefined
      });
    } catch {
      // skip malformed events
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Filter events to only those in the future (or today).
 */
export function futureEvents(events: CalendarEvent[], from: Date = new Date()): CalendarEvent[] {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  return events.filter((e) => e.end >= today || e.start >= today);
}

/**
 * Returns true when the event represents an actual attendance day.
 * Bell-schedule events whose summary contains "no school" (case-insensitive)
 * are holidays/breaks and should not be counted.
 */
export function isAttendanceDay(event: CalendarEvent): boolean {
  return !event.summary.toLowerCase().includes('no school');
}

/**
 * Find the "Last Day of School" event from events list.
 * Looks for common keywords in the summary.
 */
export function findLastDayOfSchool(events: CalendarEvent[]): CalendarEvent | null {
  const keywords = [
    'last day for students',
    'last day of school',
    'last day of classes',
    'end of school year',
    'end of school',
    'school ends',
    'last day'          // broad catch-all; placed last to avoid false matches
  ];
  const now = new Date();

  const matches = events
    .filter((e) => {
      const summary = e.summary.toLowerCase();
      return keywords.some((kw) => summary.includes(kw)) && e.start >= now;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return matches[0] ?? null;
}

/**
 * Count the number of actual school days remaining by looking at
 * the bell schedule calendar events. Each unique date in the bell
 * schedule calendar represents a school day. Events with "no school"
 * in the summary (e.g. holidays, breaks) are excluded.
 */
export function countSchoolDaysRemaining(
  bellScheduleEvents: CalendarEvent[],
  lastDay: Date | null,
  from: Date = new Date()
): number {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  const cutoff = lastDay ? new Date(lastDay) : null;
  if (cutoff) {
    cutoff.setHours(23, 59, 59, 999);
  }

  // Collect unique dates from bell schedule events, excluding "No School" days
  const schoolDates = new Set<string>();
  for (const event of bellScheduleEvents) {
    if (!isAttendanceDay(event)) continue;

    const d = new Date(event.start);
    d.setHours(0, 0, 0, 0);

    if (d < today) continue;
    if (cutoff && d > cutoff) continue;

    schoolDates.add(d.toISOString().split('T')[0]);
  }

  return schoolDates.size;
}
