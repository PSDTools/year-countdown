import type { CountdownData } from '$lib/types';

/**
 * Calculate countdown components from now until a target date.
 */
export function calculateCountdown(target: Date, now: Date = new Date()): CountdownData {
  const total = target.getTime() - now.getTime();
  const isPast = total <= 0;

  if (isPast) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total, isPast: false };
}

/**
 * Format a date relative to today (e.g., "Today", "Tomorrow", "In 3 days", "Mar 15")
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  });
}

/**
 * Format a full date string for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Pad a number to two digits
 */
export function pad(n: number): string {
  return String(n).padStart(2, '0');
}
