/**
 * Time and date utility functions for the bookings month view
 */

import { WORKING_HOURS_PER_DAY } from '../types';

/**
 * Pads a number with leading zeros to ensure 2-digit format
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats minutes into HH:MM string format
 */
export function formatMinutesToHM(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.floor(minutes || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}

/**
 * Parses HH:MM time string into minutes
 */
export function parseHMToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(v => parseInt(v, 10));
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Creates a Date object for the start of a month
 */
export function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

/**
 * Creates a Date object for the end of a month
 */
export function endOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

/**
 * Converts a day string and time string to ISO timestamp
 */
export function toISOString(day: string, timeStr: string): string {
  const [H, M] = timeStr.split(':').map(v => parseInt(v, 10));
  const [y, mo, d] = day.split('-').map(v => parseInt(v, 10));
  return new Date(y, mo - 1, d, H || 0, M || 0, 0, 0).toISOString();
}

/**
 * Checks if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Calculates working hours for a day (excluding weekends and holidays)
 */
export function calculateWorkingHoursForDay(
  date: Date,
  holidayName?: string
): number {
  if (isWeekend(date) || holidayName) {
    return 0;
  }
  return WORKING_HOURS_PER_DAY;
}

/**
 * Calculates the difference between actual and expected working hours
 */
export function calculateHoursDifference(
  actualMinutes: number,
  expectedMinutes: number
): number {
  return actualMinutes - expectedMinutes;
}

/**
 * Formats difference in minutes with +/- prefix
 */
export function formatHoursDifference(diffMinutes: number): string {
  const sign = diffMinutes >= 0 ? '+' : '-';
  return `${sign}${formatMinutesToHM(Math.abs(diffMinutes))}`;
}

/**
 * Light haptic feedback for supported devices
 */
export function vibrate(ms: number = 15): void {
  try {
    if (navigator?.vibrate) {
      navigator.vibrate(ms);
    }
  } catch {
    // Silently fail if vibration is not supported
  }
}