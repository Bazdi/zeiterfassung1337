/**
 * Validation utilities for input data and API responses
 */

import { TimeValidationResult, DateValidationResult } from '../types';

/**
 * Validates time string format (HH:MM)
 */
export function validateTimeString(timeStr: string): TimeValidationResult {
  if (!timeStr || typeof timeStr !== 'string') {
    return { isValid: false, error: 'Time string is required' };
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeStr)) {
    return { isValid: false, error: 'Invalid time format. Use HH:MM (24-hour format)' };
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { isValid: false, error: 'Invalid time values' };
  }

  return { isValid: true };
}

/**
 * Validates date string format (YYYY-MM-DD)
 */
export function validateDateString(dateStr: string): DateValidationResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date string is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  return { isValid: true };
}

/**
 * Validates that end time is after start time
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): TimeValidationResult {
  const startValidation = validateTimeString(startTime);
  if (!startValidation.isValid) {
    return startValidation;
  }

  const endValidation = validateTimeString(endTime);
  if (!endValidation.isValid) {
    return endValidation;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  return { isValid: true };
}

/**
 * Validates pause duration (must be non-negative)
 */
export function validatePauseMinutes(pauseStr: string): TimeValidationResult {
  if (!pauseStr || typeof pauseStr !== 'string') {
    return { isValid: true }; // Pause is optional
  }

  const minutes = parseDurationToMinutes(pauseStr);
  if (isNaN(minutes)) {
    return { isValid: false, error: 'Invalid pause duration. Use MM or HH:MM' };
  }

  if (minutes < 0) {
    return { isValid: false, error: 'Pause duration cannot be negative' };
  }

  if (minutes > 24 * 60) { // Max 24 hours
    return { isValid: false, error: 'Pause duration cannot exceed 24 hours' };
  }

  return { isValid: true };
}

export function parseDurationToMinutes(input: string): number {
  if (!input) return NaN;
  const trimmed = input.trim();
  // Accept "MM" or "H:MM" or "HH:MM"
  const hhmm = /^([0-9]{1,2}):([0-5][0-9])$/;
  const mm = /^[0-9]{1,4}$/; // up to 4 digits minutes
  if (hhmm.test(trimmed)) {
    const [, h, m] = trimmed.match(hhmm)!;
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  if (mm.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  return NaN;
}

/**
 * Validates note length
 */
export function validateNote(note: string): { isValid: boolean; error?: string } {
  if (!note || typeof note !== 'string') {
    return { isValid: true }; // Note is optional
  }

  if (note.length > 1000) {
    return { isValid: false, error: 'Note cannot exceed 1000 characters' };
  }

  return { isValid: true };
}

/**
 * Validates category value
 */
export function validateCategory(category: string): { isValid: boolean; error?: string } {
  const validCategories = [
    'REGULAR',
    'VACATION',
    'SICKNESS',
    'HOLIDAY',
    'WEEKEND',
    'NIGHT'
  ];

  if (!category || typeof category !== 'string') {
    return { isValid: false, error: 'Category is required' };
  }

  if (!validCategories.includes(category)) {
    return { isValid: false, error: 'Invalid category' };
  }

  return { isValid: true };
}

/**
 * Sanitizes text input by trimming and removing potentially harmful characters
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Helper function to convert time string to minutes
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates complete time entry data
 */
export function validateTimeEntryData(data: {
  start: string;
  end: string;
  pause?: string;
  note?: string;
  category: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate times
  const timeRangeValidation = validateTimeRange(data.start, data.end);
  if (!timeRangeValidation.isValid) {
    errors.push(timeRangeValidation.error!);
  }

  // Validate pause
  if (data.pause) {
    const pauseValidation = validatePauseMinutes(data.pause);
    if (!pauseValidation.isValid) {
      errors.push(pauseValidation.error!);
    }
  }

  // Validate note
  if (data.note) {
    const noteValidation = validateNote(data.note);
    if (!noteValidation.isValid) {
      errors.push(noteValidation.error!);
    }
  }

  // Validate category
  const categoryValidation = validateCategory(data.category);
  if (!categoryValidation.isValid) {
    errors.push(categoryValidation.error!);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
