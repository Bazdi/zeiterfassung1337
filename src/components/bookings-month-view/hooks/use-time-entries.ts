/**
 * Custom hook for managing time entries data, refactored with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeEntry, ApiResponse } from '../types';
import { toast } from 'sonner';

// Helper function to fetch time entries
const fetchTimeEntries = async (year: number, month: number): Promise<TimeEntry[]> => {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
  const qs = new URLSearchParams({ from, to, limit: '500' });

  const response = await fetch(`/api/time-entries?${qs}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch time entries: ${response.status}`);
  }

  const data: ApiResponse<TimeEntry[]> = await response.json();
  // The API returns data in a { data: [], pagination: {} } structure
  return Array.isArray(data.data) ? data.data : [];
};

// Helper function for creating a time entry
const createTimeEntry = async (entryData: Partial<TimeEntry>): Promise<TimeEntry> => {
  const response = await fetch('/api/time-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entryData),
  });
  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function for updating a time entry
const updateTimeEntry = async ({ id, ...updates }: Partial<TimeEntry> & { id: string }): Promise<TimeEntry> => {
  const response = await fetch(`/api/time-entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function for deleting a time entry
const deleteTimeEntry = async (id: string): Promise<void> => {
  const response = await fetch(`/api/time-entries/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
};

export function useTimeEntries(year: number, month: number) {
  const queryClient = useQueryClient();
  const queryKey = ['time-entries', year, month];

  const {
    data: entries = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<TimeEntry[], Error>({
    queryKey,
    queryFn: () => fetchTimeEntries(year, month),
  });

  const handleError = (err: unknown, message: string) => {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${message}:`, err);
    toast.error(`${message}: ${errorMessage}`);
  };

  const mutationOptions = {
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };

  const createMutation = useMutation({
    mutationFn: createTimeEntry,
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Eintrag erstellt');
    },
    onError: (err) => handleError(err, 'Fehler beim Erstellen'),
  });

  const updateMutation = useMutation({
    mutationFn: updateTimeEntry,
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Eintrag aktualisiert');
    },
    onError: (err) => handleError(err, 'Fehler beim Aktualisieren'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimeEntry,
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Eintrag gelöscht');
    },
    onError: (err) => handleError(err, 'Fehler beim Löschen'),
  });

  return {
    entries,
    loading,
    error: error?.message || null,
    refetch,
    createEntry: (entry: Partial<TimeEntry>) => createMutation.mutateAsync(entry).then(() => true).catch(() => false),
    updateEntry: (id: string, updates: Partial<TimeEntry>) => updateMutation.mutateAsync({ id, ...updates }).then(() => true).catch(() => false),
    deleteEntry: (id: string) => deleteMutation.mutateAsync(id).then(() => true).catch(() => false),
  };
}