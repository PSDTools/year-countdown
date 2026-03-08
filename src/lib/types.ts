export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
}

export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // total milliseconds remaining
  isPast: boolean;
}

/** One class period entry in a bell schedule */
export interface BellPeriod {
  label: string;   // e.g. "Period 1", "Homeroom", "1st Lunch"
  start: string;   // "HH:MM" 24-h
  end: string;     // "HH:MM" 24-h
  isLunch?: boolean;
}

/** Day types at Pattonville High School */
export type DayType = 'A' | 'B' | 'C' | 'X' | 'no-school' | 'unknown';

/** Today's resolved schedule (null when school is not in session) */
export interface TodaySchedule {
  dayType: DayType;
  /** Human label from the bell calendar event (e.g. "A Day", "C Day – X Day") */
  label: string;
  periods: BellPeriod[];
  /** Index into periods[] for the currently-active period, -1 if none active */
  activePeriodIndex: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  lastDayOfSchool: CalendarEvent | null;
  schoolDaysRemaining: number;
  todaySchedule: TodaySchedule | null;
  fetchedAt: Date;
}
