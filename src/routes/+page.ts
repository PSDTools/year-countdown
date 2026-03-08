import { parseICS, futureEvents, findLastDayOfSchool, countSchoolDaysRemaining } from '$lib/utils/ical';
import type { CalendarData } from '$lib/types';

const MAIN_CALENDAR_URL = 'https://phs.psdr3.org/calendar/calendar_362.ics';
const BELL_SCHEDULE_URL =
  'https://calendar.google.com/calendar/ical/c_ihdnrdu2e4s0d01qeinmvbjms4%40group.calendar.google.com/public/basic.ics';

const CORS_PROXY = 'https://corsproxy.io/?url=';

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

export const prerender = false;
export const ssr = false;

export async function load(): Promise<{ calendar: CalendarData | null; error: string | null }> {
  try {
    const [mainIcs, bellIcs] = await Promise.allSettled([
      fetchCalendar(MAIN_CALENDAR_URL),
      fetchCalendar(BELL_SCHEDULE_URL)
    ]);

    const mainText = mainIcs.status === 'fulfilled' ? mainIcs.value : null;
    const bellText = bellIcs.status === 'fulfilled' ? bellIcs.value : null;

    if (!mainText && !bellText) {
      return { calendar: null, error: 'Unable to fetch calendar data. Please check your connection.' };
    }

    const mainEvents = mainText ? futureEvents(parseICS(mainText)) : [];
    const bellEvents = bellText ? parseICS(bellText) : [];

    const lastDay = findLastDayOfSchool(mainEvents);
    const schoolDaysRemaining = countSchoolDaysRemaining(
      bellEvents,
      lastDay ? lastDay.end : null
    );

    // Show only upcoming events (next 60 days) from main calendar
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 60);

    const upcomingEvents = mainEvents.filter((e) => e.start <= cutoff).slice(0, 20);

    return {
      calendar: {
        events: upcomingEvents,
        lastDayOfSchool: lastDay,
        schoolDaysRemaining,
        fetchedAt: new Date()
      },
      error: null
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { calendar: null, error: `Failed to load calendar data: ${message}` };
  }
}
