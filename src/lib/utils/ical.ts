import ICAL from 'ical.js';
import type { CalendarEvent, BellPeriod, DayType, TodaySchedule } from '$lib/types';

// ─── Static bell-schedule data ─────────────────────────────────────────────
// Source: https://www.psdr3.org/domain/300  (Pattonville High School bell page)

export const BELL_SCHEDULES: Record<Exclude<DayType, 'no-school' | 'unknown'>, BellPeriod[]> = {
  A: [
    { label: 'Period 1',   start: '07:23', end: '08:12' },
    { label: 'Period 2',   start: '08:18', end: '09:07' },
    { label: 'Period 3',   start: '09:13', end: '10:05' },
    { label: 'Period 4',   start: '10:11', end: '11:00' },
    { label: '1st Lunch',  start: '11:00', end: '11:32', isLunch: true },
    { label: '2nd Lunch',  start: '11:32', end: '12:03', isLunch: true },
    { label: '3rd Lunch',  start: '12:03', end: '12:34', isLunch: true },
    { label: 'Period 5',   start: '11:06', end: '12:28' },
    { label: 'Period 6',   start: '12:34', end: '13:23' },
    { label: 'Period 7',   start: '13:29', end: '14:18' },
  ],
  B: [
    { label: 'Period 1',   start: '07:23', end: '08:53' },
    { label: 'Period 3',   start: '08:59', end: '10:30' },
    { label: '1st Lunch',  start: '10:30', end: '11:01', isLunch: true },
    { label: '2nd Lunch',  start: '11:07', end: '11:38', isLunch: true },
    { label: '3rd Lunch',  start: '12:11', end: '12:42', isLunch: true },
    { label: 'Period 5',   start: '10:36', end: '12:42' },
    { label: 'Period 7',   start: '12:48', end: '14:18' },
  ],
  C: [
    { label: 'Period 2',   start: '07:23', end: '08:53' },
    { label: 'Homeroom',   start: '08:59', end: '09:35' },
    { label: 'Period 4',   start: '09:41', end: '11:11' },
    { label: '1st Lunch',  start: '11:11', end: '11:41', isLunch: true },
    { label: '2nd Lunch',  start: '11:47', end: '12:19', isLunch: true },
    { label: '3rd Lunch',  start: '12:49', end: '13:19', isLunch: true },
    { label: 'Period 6',   start: '11:17', end: '13:19' },
  ],
  X: [
    { label: 'Period 2',   start: '07:23', end: '08:53' },
    { label: 'Homeroom',   start: '08:59', end: '10:30' },
    { label: '1st Lunch',  start: '10:30', end: '11:01', isLunch: true },
    { label: '2nd Lunch',  start: '11:07', end: '11:38', isLunch: true },
    { label: '3rd Lunch',  start: '12:11', end: '12:42', isLunch: true },
    { label: 'Period 4',   start: '10:36', end: '12:42' },
    { label: 'Period 6',   start: '12:48', end: '14:18' },
  ],
};

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

// ─── Helper: parse "HH:MM" into today's Date ──────────────────────────────
function timeToDate(hhmm: string, baseDate: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Determine today's day type and active bell schedule from the bell-schedule
 * calendar events.  Returns null when today is not a school day.
 */
export function getTodaySchedule(
  bellScheduleEvents: CalendarEvent[],
  now: Date = new Date()
): TodaySchedule | null {
  const todayStr = now.toISOString().split('T')[0];

  // Find all bell events on today's date
  const todayEvents = bellScheduleEvents.filter((e) => {
    const d = new Date(e.start);
    return d.toISOString().split('T')[0] === todayStr;
  });

  if (todayEvents.length === 0) return null;

  // Pick the most representative event (prefer the one that names a day type)
  const primary = todayEvents[0];
  const summaryLower = primary.summary.toLowerCase();

  // Detect day type from summary (the bell calendar uses titles like "A Day", "B Day", etc.)
  let dayType: DayType = 'unknown';
  if (summaryLower.includes('no school')) {
    dayType = 'no-school';
  } else if (summaryLower.includes('x day')) {
    // X Day check before C Day because "X Day" events sometimes contain "C Day"
    dayType = 'X';
  } else if (summaryLower.includes('c day')) {
    dayType = 'C';
  } else if (summaryLower.includes('b day')) {
    dayType = 'B';
  } else if (summaryLower.includes('a day')) {
    dayType = 'A';
  }

  if (dayType === 'no-school' || dayType === 'unknown') return null;

  const periods = BELL_SCHEDULES[dayType];

  // Determine which period is currently active.
  // Lunch periods are sub-slots of their enclosing class period (e.g. Period 5
  // on A Day encompasses all three lunch shifts). Check lunch periods FIRST so
  // that during a lunch window the lunch row is highlighted rather than the
  // parent period.
  let activePeriodIndex = -1;
  const lunchIndices   = periods.map((p, i) => (p.isLunch ? i : -1)).filter(i => i >= 0);
  const regularIndices = periods.map((p, i) => (!p.isLunch ? i : -1)).filter(i => i >= 0);
  const prioritised = [...lunchIndices, ...regularIndices];

  for (const i of prioritised) {
    const p     = periods[i];
    const start = timeToDate(p.start, now);
    const end   = timeToDate(p.end,   now);
    if (now >= start && now < end) {
      activePeriodIndex = i;
      break;
    }
  }

  return {
    dayType,
    label: primary.summary,
    periods,
    activePeriodIndex,
  };
}

