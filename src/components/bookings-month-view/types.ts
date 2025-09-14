export type TimeEntryCategory =
  | 'REGULAR'
  | 'VACATION'
  | 'SICKNESS'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'NIGHT';

export interface TimeEntry {
  id: string;
  start_utc: string;
  end_utc: string | null;
  duration_minutes: number | null;
  pause_total_minutes?: number | null;
  category: TimeEntryCategory;
  note: string | null;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface EditingState {
  day: string;
  field: 'start' | 'end' | 'pause' | 'duration';
  value: string;
}

export interface CreateEntryBuffer {
  start: string;
  end: string;
  pause?: string;
  note: string;
  category: TimeEntryCategory;
}

export interface WeekSummary {
  ist: number;
  pause: number;
  soll: number;
}

export interface BookingsMonthViewProps {
  initialYear?: number;
  initialMonth?: number;
}

export interface DayRowData {
  date: string;
  entries: TimeEntry[];
  isWeekend: boolean;
  holidayName?: string;
  totalMinutes: number;
  pauseTotal: number;
  sollMinutes: number;
  diffMinutes: number;
  representativeCategory?: TimeEntryCategory;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

export const WORKING_HOURS_PER_DAY = 7 * 60 + 42; // 7 hours 42 minutes
export const WORKING_DAYS_PER_WEEK = 5;