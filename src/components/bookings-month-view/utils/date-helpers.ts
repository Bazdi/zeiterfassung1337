/**
 * Date manipulation utilities for the bookings month view
 */

/**
 * Generates an array of ISO date strings for all days in a month
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  const days: string[] = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(currentDate.toISOString().slice(0, 10));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return days;
}

/**
 * Calculates ISO week number for a given date
 * Based on ISO 8601 standard (Monday is start of week)
 */
export function getISOWeekNumber(dateString: string): { year: number; week: number } {
  const date = new Date(dateString + 'T00:00:00Z');
  const tempDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));

  // Get day of week (0 = Sunday, 6 = Saturday)
  // Convert to Monday = 0, Sunday = 6
  const dayOfWeek = (tempDate.getUTCDay() + 6) % 7;

  // Move to Thursday of current week (ISO week calculation)
  tempDate.setUTCDate(tempDate.getUTCDate() - dayOfWeek + 3);

  // Get first Thursday of the year
  const firstThursday = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);

  // Calculate difference in days
  const diffDays = Math.floor(
    (tempDate.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000)
  );

  const week = 1 + Math.floor(diffDays / 7);
  const year = tempDate.getUTCFullYear();

  return { year, week };
}

/**
 * Gets the last day of each ISO week in a month
 */
export function getWeekLastDays(
  year: number,
  month: number
): Map<string, string> {
  const days = getDaysInMonth(year, month);
  const weekLastDays = new Map<string, string>();

  for (const day of days) {
    const { year: weekYear, week } = getISOWeekNumber(day);
    const weekKey = `${weekYear}-W${String(week).padStart(2, '0')}`;
    weekLastDays.set(weekKey, day);
  }

  return weekLastDays;
}

/**
 * Formats a date for display in German locale
 */
export function formatDateForDisplay(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
): string {
  const date = new Date(dateString + 'T00:00:00Z');
  return new Intl.DateTimeFormat('de-DE', options).format(date);
}

/**
 * Converts a Date object to HH:MM time string
 */
export function dateToTimeString(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Creates a Date object from date and time strings
 */
export function createDateFromStrings(
  dateString: string,
  timeString: string
): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the week key for a given date
 */
export function getWeekKey(dateString: string): string {
  const { year, week } = getISOWeekNumber(dateString);
  return `${year}-W${String(week).padStart(2, '0')}`;
}