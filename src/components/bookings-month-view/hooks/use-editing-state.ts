/**
 * Custom hook for managing inline editing state
 */

import { useState, useCallback } from 'react';
import { EditingState } from '../types';

interface UseEditingStateResult {
  editing: EditingState | null;
  startEditing: (day: string, field: 'start' | 'end' | 'pause' | 'duration', value: string) => void;
  stopEditing: () => void;
  updateValue: (value: string) => void;
  isEditing: (day: string, field: 'start' | 'end' | 'pause' | 'duration') => boolean;
}

export function useEditingState(): UseEditingStateResult {
  const [editing, setEditing] = useState<EditingState | null>(null);

  const startEditing = useCallback((
    day: string,
    field: 'start' | 'end' | 'pause' | 'duration',
    value: string
  ) => {
    setEditing({ day, field, value });
  }, []);

  const stopEditing = useCallback(() => {
    setEditing(null);
  }, []);

  const updateValue = useCallback((value: string) => {
    if (editing) {
      setEditing({ ...editing, value });
    }
  }, [editing]);

  const isEditing = useCallback((
    day: string,
    field: 'start' | 'end' | 'pause' | 'duration'
  ): boolean => {
    return editing?.day === day && editing?.field === field;
  }, [editing]);

  return {
    editing,
    startEditing,
    stopEditing,
    updateValue,
    isEditing
  };
}