/**
 * Unit tests for time-helpers utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  pad2,
  formatMinutesToHM,
  parseHMToMinutes,
  toISOString,
  calculateWorkingHoursForDay,
  formatHoursDifference,
  vibrate
} from './time-helpers';

describe('pad2', () => {
  it('should pad single digit numbers with leading zero', () => {
    expect(pad2(5)).toBe('05');
    expect(pad2(0)).toBe('00');
  });

  it('should not pad double digit numbers', () => {
    expect(pad2(10)).toBe('10');
    expect(pad2(99)).toBe('99');
  });
});

describe('formatMinutesToHM', () => {
  it('should format minutes to HH:MM format', () => {
    expect(formatMinutesToHM(0)).toBe('00:00');
    expect(formatMinutesToHM(60)).toBe('01:00');
    expect(formatMinutesToHM(90)).toBe('01:30');
    expect(formatMinutesToHM(480)).toBe('08:00');
  });

  it('should handle null and undefined values', () => {
    expect(formatMinutesToHM(null)).toBe('00:00');
    expect(formatMinutesToHM(undefined)).toBe('00:00');
  });

  it('should handle negative values', () => {
    expect(formatMinutesToHM(-60)).toBe('00:00');
  });
});

describe('parseHMToMinutes', () => {
  it('should parse HH:MM format to minutes', () => {
    expect(parseHMToMinutes('00:00')).toBe(0);
    expect(parseHMToMinutes('01:00')).toBe(60);
    expect(parseHMToMinutes('01:30')).toBe(90);
    expect(parseHMToMinutes('08:00')).toBe(480);
  });
});

describe('toISOString', () => {
  it('should convert date and time to ISO string', () => {
    const result = toISOString('2024-01-01', '08:00');
    expect(result).toBe('2024-01-01T08:00:00.000Z');
  });

  it('should handle different times', () => {
    const result = toISOString('2024-12-31', '16:30');
    expect(result).toBe('2024-12-31T16:30:00.000Z');
  });
});

describe('calculateWorkingHoursForDay', () => {
  it('should return 0 for weekends', () => {
    const saturday = new Date('2024-01-06T00:00:00Z'); // Saturday
    const sunday = new Date('2024-01-07T00:00:00Z'); // Sunday

    expect(calculateWorkingHoursForDay(saturday)).toBe(0);
    expect(calculateWorkingHoursForDay(sunday)).toBe(0);
  });

  it('should return 0 for holidays', () => {
    const weekday = new Date('2024-01-01T00:00:00Z'); // Monday
    const holidayName = 'New Year';

    expect(calculateWorkingHoursForDay(weekday, holidayName)).toBe(0);
  });

  it('should return working hours for regular weekdays', () => {
    const monday = new Date('2024-01-01T00:00:00Z'); // Monday (but date doesn't matter for day of week)

    // Mock as Monday
    Object.defineProperty(monday, 'getUTCDay', { value: () => 1 });

    expect(calculateWorkingHoursForDay(monday)).toBe(7 * 60 + 42);
  });
});

describe('formatHoursDifference', () => {
  it('should format positive differences with + prefix', () => {
    expect(formatHoursDifference(60)).toBe('+01:00');
    expect(formatHoursDifference(90)).toBe('+01:30');
  });

  it('should format negative differences with - prefix', () => {
    expect(formatHoursDifference(-60)).toBe('-01:00');
    expect(formatHoursDifference(-90)).toBe('-01:30');
  });

  it('should format zero difference', () => {
    expect(formatHoursDifference(0)).toBe('+00:00');
  });
});

describe('vibrate', () => {
  it('should not throw error when vibration is not supported', () => {
    // Mock navigator.vibrate as undefined
    const originalVibrate = navigator.vibrate;
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true
    });

    expect(() => vibrate(100)).not.toThrow();

    // Restore original
    Object.defineProperty(navigator, 'vibrate', {
      value: originalVibrate,
      writable: true
    });
  });
});