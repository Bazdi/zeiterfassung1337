/**
 * Custom hook for managing time entries data
 */

import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, ApiResponse } from '../types';
import { toast } from 'sonner';

interface UseTimeEntriesResult {
  entries: TimeEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createEntry: (entry: Partial<TimeEntry>) => Promise<boolean>;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
}

export function useTimeEntries(
  year: number,
  month: number
): UseTimeEntriesResult {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
      const qs = new URLSearchParams({ from, to, limit: '500' });

      const response = await fetch(`/api/time-entries?${qs}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch time entries: ${response.status}`);
      }

      const data: ApiResponse<TimeEntry[]> = await response.json();
      const fetchedEntries = Array.isArray(data.data) ? data.data :
                            Array.isArray(data) ? data : [];

      setEntries(fetchedEntries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching time entries:', err);
      toast.error('Fehler beim Laden der Zeiteinträge');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const createEntry = useCallback(async (entryData: Partial<TimeEntry>): Promise<boolean> => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const newEntry: TimeEntry = await response.json();
      setEntries(prev => [newEntry, ...prev]);
      toast.success('Eintrag erstellt');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error creating time entry:', err);
      toast.error(`Fehler beim Erstellen: ${errorMessage}`);
      return false;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const updatedEntry: TimeEntry = await response.json();
      setEntries(prev => prev.map(entry =>
        entry.id === id ? updatedEntry : entry
      ));
      toast.success('Eintrag aktualisiert');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error updating time entry:', err);
      toast.error(`Fehler beim Aktualisieren: ${errorMessage}`);
      return false;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Eintrag gelöscht');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error deleting time entry:', err);
      toast.error(`Fehler beim Löschen: ${errorMessage}`);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    refetch: fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry
  };
}