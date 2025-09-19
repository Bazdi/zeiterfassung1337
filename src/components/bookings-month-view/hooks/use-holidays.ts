/**
 * Custom hook for managing holiday data, refactored with TanStack Query
 */
import { useQuery } from '@tanstack/react-query';
import { Holiday, ApiResponse } from '../types';

// Helper function to fetch holidays
const fetchHolidays = async (year: number, month: number): Promise<Map<string, string>> => {
  const response = await fetch(`/api/holidays?year=${year}&month=${month}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch holidays: ${response.status}`);
  }

  const data: ApiResponse<Holiday[]> = await response.json();
  const holidayMap = new Map<string, string>();

  const holidayList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

  for (const holiday of holidayList) {
    // The date from the server is a full ISO string, but we only need the date part.
    holidayMap.set(holiday.date.slice(0, 10), holiday.name);
  }

  return holidayMap;
};

export function useHolidays(year: number, month: number) {
  const queryKey = ['holidays', year, month];

  const {
    data: holidays = new Map(),
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Map<string, string>, Error>({
    queryKey,
    queryFn: () => fetchHolidays(year, month),
    // Holidays don't change often, so we can use a long staleTime
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    holidays,
    loading,
    error: error?.message || null,
    refetch,
  };
}