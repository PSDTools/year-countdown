import { parseICS, futureEvents, findLastDayOfSchool, countSchoolDaysRemaining, isAttendanceDay, getTodaySchedule } from '$lib/utils/ical';
import type { CalendarData } from '$lib/types';

const MAIN_CALENDAR_URL = 'https://phs.psdr3.org/calendar/calendar_362.ics';
const BELL_SCHEDULE_URL =
  'https://calendar.google.com/calendar/ical/c_ihdnrdu2e4s0d01qeinmvbjms4%40group.calendar.google.com/public/basic.ics';

const CORS_PROXY = 'https://corsproxy.io/?url=';

/** Hardcoded fallback: last day of school for Pattonville High School 2025–2026 */
function getLastDayFallback(): import('$lib/types').CalendarEvent {
  const d = new Date(2026, 4, 22, 14, 18, 0, 0); // May 22 2026, 2:18 PM (end of school)
  return {
    id: 'last-day-fallback',
    summary: 'Last Day for Students',
    start: d,
    end: d,
    allDay: true,
  };
}

async function fetchCalendar(url: string): Promise<string | null> {
  // Try direct fetch first
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return res.text();
  } catch {
    // Direct fetch failed, try with CORS proxy
  }

  // Try with CORS proxy as fallback
  try {
    const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const res = await fetch(proxied, { signal: AbortSignal.timeout(10000) });
    if (res.ok) return res.text();
  } catch {
    // Both failed
  }

  return null;
}

export const prerender = true;
export const ssr = false;

export async function load(): Promise<{ calendar: CalendarData | null; error: string | null }> {
  try {
    const [mainIcs, bellIcs] = await Promise.allSettled([
      fetchCalendar(MAIN_CALENDAR_URL),
      fetchCalendar(BELL_SCHEDULE_URL)
    ]);

    const mainText = mainIcs.status === 'fulfilled' ? mainIcs.value : null;
    const bellText = bellIcs.status === 'fulfilled' ? bellIcs.value : null;

    const mainEvents = mainText ? futureEvents(parseICS(mainText)) : [];
    const bellEvents = bellText ? parseICS(bellText) : [];

    let lastDay = findLastDayOfSchool(mainEvents);

    // Fallback: if the main calendar has no "last day" event, use the latest
    // attendance day from the bell schedule as the end-of-school countdown target.
    if (!lastDay && bellEvents.length > 0) {
      const now = new Date();
      const attendanceDays = bellEvents
        .filter((e) => isAttendanceDay(e) && e.start >= now)
        .sort((a, b) => b.start.getTime() - a.start.getTime());
      if (attendanceDays.length > 0) {
        lastDay = { ...attendanceDays[0], summary: 'Last Day for Students' };
      }
    }

    // Final fallback: hardcoded last day of school
    if (!lastDay) {
      lastDay = getLastDayFallback();
    }

    const schoolDaysRemaining = countSchoolDaysRemaining(
      bellEvents,
      lastDay ? lastDay.end : null
    );

    return {
      calendar: {
        events: [],
        lastDayOfSchool: lastDay,
        schoolDaysRemaining,
        todaySchedule: getTodaySchedule(bellEvents),
        fetchedAt: new Date()
      },
      error: !mainText && !bellText ? 'Unable to fetch live calendar data — showing estimated last day.' : null
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      calendar: {
        events: [],
        lastDayOfSchool: getLastDayFallback(),
        schoolDaysRemaining: 0, // unknown without bell schedule data
        todaySchedule: null,
        fetchedAt: new Date()
      },
      error: `Using estimated last day (could not load live data: ${message})`
    };
  }
}
