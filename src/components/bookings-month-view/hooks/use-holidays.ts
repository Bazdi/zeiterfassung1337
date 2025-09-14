/**
 * Custom hook for managing holiday data
 */

import { useState, useEffect, useCallback } from 'react';
import { Holiday, ApiResponse } from '../types';
import { toast } from 'sonner';

interface UseHolidaysResult {
  holidays: Map<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHolidays(year: number, month: number): UseHolidaysResult {
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/holidays?year=${year}&month=${month}`, {
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch holidays: ${response.status}`);
      }

      const data: ApiResponse<Holiday[]> = await response.json();
      const holidayMap = new Map<string, string>();

      const holidayList = Array.isArray(data.data) ? data.data :
                         Array.isArray(data) ? data : [];

      for (const holiday of holidayList) {
        holidayMap.set(holiday.date, holiday.name);
      }

      setHolidays(holidayMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching holidays:', err);
      // Don't show toast for holiday errors as they're not critical
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    error,
    refetch: fetchHolidays
  };
}