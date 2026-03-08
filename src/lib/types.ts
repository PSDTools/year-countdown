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

export interface CalendarData {
  events: CalendarEvent[];
  lastDayOfSchool: CalendarEvent | null;
  schoolDaysRemaining: number;
  fetchedAt: Date;
}
