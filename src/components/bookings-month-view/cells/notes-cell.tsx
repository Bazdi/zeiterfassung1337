/**
 * Notes cell component with inline editing capabilities
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
  className = 'max-w-[360px] text-sm text-foreground'
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
      <div className="flex flex-col gap-2 text-sm text-foreground">
        <div className="w-[200px]">
          <Select
            value={createCategory}
            onValueChange={(value: TimeEntryCategory) => setCreateCategory(value)}
          >
            <SelectTrigger className={cn(!isValid && 'border-destructive focus-visible:ring-destructive')}>
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent className="border border-border bg-popover text-popover-foreground shadow-lg">
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
          className={cn(!isValid && 'border-destructive focus-visible:ring-destructive')}
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
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {displayCategory}
        </div>
      )}
      <div
        className="truncate text-sm text-muted-foreground"
        title={combinedNotes}
      >
        {combinedNotes}
      </div>
    </div>
  );
}
