/**
 * Notes cell component with inline editing capabilities
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntryCategory } from '../types';
import { validateNote, validateCategory, sanitizeTextInput } from '../utils/validation';
import { vibrate } from '../utils/time-helpers';

interface NotesCellProps {
  notes: string[];
  category?: TimeEntryCategory;
  isCreating?: boolean;
  onCreateSave: (data: { note: string; category: TimeEntryCategory }) => Promise<void>;
  onCreateCancel: () => void;
  className?: string;
}

export function NotesCell({
  notes,
  category,
  isCreating = false,
  onCreateSave,
  onCreateCancel,
  className = 'text-gray-700 max-w-[360px]'
}: NotesCellProps) {
  const [createNote, setCreateNote] = useState('');
  const [createCategory, setCreateCategory] = useState<TimeEntryCategory>('REGULAR');
  const [isValid, setIsValid] = useState(true);

  const handleCreateSave = async () => {
    const sanitizedNote = sanitizeTextInput(createNote);
    const noteValidation = validateNote(sanitizedNote);
    const categoryValidation = validateCategory(createCategory);

    const isDataValid = noteValidation.isValid && categoryValidation.isValid;
    setIsValid(isDataValid);

    if (isDataValid) {
      try {
        await onCreateSave({
          note: sanitizedNote,
          category: createCategory
        });
        // Reset form
        setCreateNote('');
        setCreateCategory('REGULAR');
        setIsValid(true);
        vibrate(12);
      } catch (error) {
        console.error('Failed to save note:', error);
        setIsValid(false);
      }
    }
  };

  const handleCreateCancel = () => {
    setCreateNote('');
    setCreateCategory('REGULAR');
    setIsValid(true);
    onCreateCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCreateCancel();
    }
  };

  if (isCreating) {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-[180px]">
          <Select
            value={createCategory}
            onValueChange={(value: TimeEntryCategory) => setCreateCategory(value)}
          >
            <SelectTrigger className={!isValid ? 'border-red-500' : ''}>
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGULAR">Arbeitszeit</SelectItem>
              <SelectItem value="VACATION">Urlaub</SelectItem>
              <SelectItem value="SICKNESS">Krank</SelectItem>
              <SelectItem value="HOLIDAY">Feiertag</SelectItem>
              <SelectItem value="WEEKEND">Wochenende</SelectItem>
              <SelectItem value="NIGHT">Nachtarbeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Notiz"
          value={createNote}
          onChange={(e) => setCreateNote(e.target.value)}
          onKeyDown={handleKeyDown}
          className={!isValid ? 'border-red-500' : ''}
          autoFocus
        />
      </div>
    );
  }

  // Display mode
  const combinedNotes = notes.filter(Boolean).join('; ');
  const displayCategory = category && category !== 'REGULAR' ? category : null;

  return (
    <div className={className}>
      {displayCategory && (
        <div className="text-xs text-gray-500 mb-1">
          {displayCategory}
        </div>
      )}
      <div
        className="truncate"
        title={combinedNotes}
      >
        {combinedNotes}
      </div>
    </div>
  );
}