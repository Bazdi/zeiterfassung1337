/**
 * Day row component for displaying and editing a single day's time entries
 */

import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { TimeEntry, CreateEntryBuffer, TimeEntryCategory } from '../types';
import { EditableTimeCell } from '../cells/editable-time-cell';
import { EditablePauseCell } from '../cells/editable-pause-cell';
import {
  formatMinutesToHM,
  formatHoursDifference,
  calculateWorkingHoursForDay,
  vibrate,
  parseHMToMinutes
} from '../utils/time-helpers';
import { formatDateForDisplay } from '../utils/date-helpers';

interface DayRowProps {
  date: string;
  entries: TimeEntry[];
  holidayName?: string;
  isEditing: (day: string, field: 'start' | 'end' | 'pause' | 'duration') => boolean;
  onStartEditing: (day: string, field: 'start' | 'end' | 'pause' | 'duration', value: string) => void;
  onStopEditing: () => void;
  onSaveTime: (day: string, field: 'start' | 'end', value: string) => Promise<void>;
  onSavePause: (day: string, value: number) => Promise<void>;
  onSaveDuration: (day: string, value: string) => Promise<void>;
  isCreating: boolean;
  createBuffer: CreateEntryBuffer;
  onStartCreating: (day: string) => void;
  onCreateSave: (day: string, buffer: CreateEntryBuffer) => Promise<void>;
  onCreateCancel: () => void;
  onUpdateCreateBuffer: (updates: Partial<CreateEntryBuffer>) => void;
  onShowDetails: (day: string) => void;
}

const DayRowComponent: React.FC<DayRowProps> = ({
  date,
  entries,
  holidayName,
  isEditing,
  onStartEditing,
  onStopEditing,
  onSaveTime,
  onSavePause,
  onSaveDuration,
  isCreating,
  createBuffer,
  onStartCreating,
  onCreateSave,
  onCreateCancel,
  onUpdateCreateBuffer,
  onShowDetails
}) => {
  const dateObj = React.useMemo(() => new Date(`${date}T00:00:00Z`), [date]);
  const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;

  const calculations = useMemo(() => {
    const first = entries[0];
    const last = entries[entries.length - 1];

    const totalMinutes = entries.reduce((sum, entry) =>
      sum + (entry.duration_minutes || 0), 0
    );

    const pauseTotal = entries.reduce((sum, entry) =>
      sum + (entry.pause_total_minutes || 0), 0
    );

    const sollMinutes = calculateWorkingHoursForDay(dateObj, holidayName);
    const diffMinutes = totalMinutes - sollMinutes;

    const representativeCategory = entries.find(entry =>
      entry.category && entry.category !== 'REGULAR'
    )?.category || entries[0]?.category;

    return {
      first,
      last,
      totalMinutes,
      pauseTotal,
      sollMinutes,
      diffMinutes,
      representativeCategory
    };
  }, [entries, dateObj, holidayName]);

  const weekday = formatDateForDisplay(date);

  const handleTimeSave = useCallback(async (field: 'start' | 'end', value: string) => {
    await onSaveTime(date, field, value);
    onStopEditing();
  }, [date, onSaveTime, onStopEditing]);

  const handlePauseSave = useCallback(async (value: number) => {
    await onSavePause(date, value);
    onStopEditing();
  }, [date, onSavePause, onStopEditing]);

  const handleDurationSave = useCallback(async (value: string) => {
    await onSaveDuration(date, value);
    onStopEditing();
  }, [date, onSaveDuration, onStopEditing]);

  const handleCreateSave = useCallback(async (data: { note: string; category: TimeEntryCategory }) => {
    const buffer = { ...createBuffer, ...data };
    await onCreateSave(date, buffer);
  }, [createBuffer, date, onCreateSave]);

  const interactiveCellClasses = "flex h-10 w-full items-center justify-start rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const placeholderButtonClasses = "absolute inset-0 flex h-full w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent text-sm font-medium text-muted-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <>
      <tr
        className={cn(
          'border-b border-border transition-colors',
          isWeekend && 'bg-muted/30',
          holidayName && 'bg-primary/5'
        )}
      >
        {/* Day Column */}
        <td className="whitespace-nowrap py-3 px-2 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => {
                onShowDetails(date);
                vibrate(8);
              }}
              title="Details anzeigen"
              aria-label={`Details für ${weekday} anzeigen`}
            >
              {weekday}
            </button>
            {isWeekend && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Wochenende
              </span>
            )}
            {holidayName && (
              <span
                className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                title={holidayName}
              >
                Feiertag
              </span>
            )}
            {calculations.representativeCategory && calculations.representativeCategory !== 'REGULAR' && (
              <span
                className="inline-flex items-center rounded-full bg-secondary/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground"
                title={calculations.representativeCategory}
              >
                {calculations.representativeCategory}
              </span>
            )}
          </div>
        </td>

        {/* Start Time Column */}
        <td key={`start-${date}-${isCreating ? 'creating' : 'normal'}`} className="py-2 px-2">
          {isEditing(date, 'start') ? (
            <EditableTimeCell
              className="h-10 w-[120px]"
              value={calculations.first ? new Date(calculations.first.start_utc).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }) : ''}
              onSave={(value) => handleTimeSave('start', value)}
              onCancel={onStopEditing}
              aria-label="Startzeit bearbeiten"
            />
          ) : calculations.first ? (
            <button
              className={cn(interactiveCellClasses, 'w-[120px]')}
              onClick={() => {
                const timeStr = new Date(calculations.first.start_utc).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                onStartEditing(date, 'start', timeStr);
                vibrate(8);
              }}
              aria-label={`Startzeit ${new Date(calculations.first.start_utc).toLocaleTimeString('de-DE')} bearbeiten`}
            >
              {new Date(calculations.first.start_utc).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </button>
          ) : (
            <div className="relative h-10 w-[120px]">
              <EditableTimeCell
                className={cn(
                  'absolute inset-0 h-full w-full transition-opacity',
                  isCreating ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
                )}
                value={createBuffer.start}
                onSave={() => handleCreateSave({ note: '', category: 'REGULAR' })}
                onCancel={onCreateCancel}
                onChange={(v) => onUpdateCreateBuffer({ start: v })}
                aria-label="Startzeit eingeben"
                shouldFocus={isCreating}
              />
              <button
                className={cn(
                  placeholderButtonClasses,
                  isCreating ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
                )}
                onClick={() => {
                  onStartCreating(date);
                  vibrate(8);
                }}
                aria-label="Neuen Eintrag erstellen"
              >
                --:--
              </button>
            </div>
          )}
        </td>

        {/* End Time Column */}
        <td key={`end-${date}-${isCreating ? 'creating' : 'normal'}`} className="py-2 px-2">
          {isEditing(date, 'end') ? (
            <EditableTimeCell
              className="h-10 w-[120px]"
              value={calculations.last?.end_utc ? new Date(calculations.last.end_utc).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }) : ''}
              onSave={(value) => handleTimeSave('end', value)}
              onCancel={onStopEditing}
              aria-label="Endzeit bearbeiten"
            />
          ) : calculations.last?.end_utc ? (
            <button
              className={cn(interactiveCellClasses, 'w-[120px]')}
              onClick={() => {
                const timeStr = new Date(calculations.last.end_utc!).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                onStartEditing(date, 'end', timeStr);
                vibrate(8);
              }}
              aria-label={`Endzeit ${new Date(calculations.last.end_utc!).toLocaleTimeString('de-DE')} bearbeiten`}
            >
              {new Date(calculations.last.end_utc).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </button>
          ) : (
            <div className="relative h-10 w-[120px]">
              <EditableTimeCell
                className={cn(
                  'absolute inset-0 h-full w-full transition-opacity',
                  isCreating ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
                )}
                value={createBuffer.end}
                onSave={() => handleCreateSave({ note: '', category: 'REGULAR' })}
                onCancel={onCreateCancel}
                onChange={(v) => onUpdateCreateBuffer({ end: v })}
                aria-label="Endzeit eingeben"
                shouldFocus={isCreating}
              />
              <button
                className={cn(
                  placeholderButtonClasses,
                  isCreating ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
                )}
                onClick={() => {
                  onStartCreating(date);
                  vibrate(8);
                }}
                aria-label="Neuen Eintrag erstellen"
              >
                --:--
              </button>
            </div>
          )}
        </td>

        {/* IST Column */}
        <td className="py-2 px-2 text-sm font-medium text-foreground">
          {isEditing(date, 'duration') || entries.length === 0 ? (
            <EditableTimeCell
              className="h-10 w-[120px]"
              value={formatMinutesToHM(calculations.totalMinutes)}
              onSave={handleDurationSave}
              onCancel={onStopEditing}
              aria-label="Dauer bearbeiten"
              placeholder="00:00"
            />
          ) : (
            <button
              className={cn(interactiveCellClasses, 'w-[120px]')}
              onClick={() => {
                const durationStr = formatMinutesToHM(calculations.totalMinutes);
                onStartEditing(date, 'duration', durationStr);
                vibrate(8);
              }}
              aria-label={`Dauer ${formatMinutesToHM(calculations.totalMinutes)} bearbeiten`}
            >
              {formatMinutesToHM(calculations.totalMinutes)}
            </button>
          )}
        </td>

        {/* Pause Column */}
        <td key={`pause-${date}-${isCreating ? 'creating' : 'normal'}`} className="py-2 px-2">
          {isEditing(date, 'pause') ? (
            <EditablePauseCell
              className="h-10 w-[110px]"
              value={formatMinutesToHM(calculations.pauseTotal)}
              onSave={handlePauseSave}
              onCancel={onStopEditing}
              aria-label="Pause bearbeiten"
            />
          ) : calculations.pauseTotal > 0 ? (
            <button
              className={cn(interactiveCellClasses, 'w-[110px]')}
              onClick={() => {
                onStartEditing(date, 'pause', formatMinutesToHM(calculations.pauseTotal));
                vibrate(8);
              }}
              aria-label={`Pause ${formatMinutesToHM(calculations.pauseTotal)} bearbeiten`}
            >
              {formatMinutesToHM(calculations.pauseTotal)}
            </button>
          ) : (
            <div className="relative h-10 w-[110px]">
              <EditablePauseCell
                className={cn(
                  'absolute inset-0 h-full w-full transition-opacity',
                  isCreating ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
                )}
                value={createBuffer.pause || '00:00'}
                onSave={async () => {
                  if (entries.length === 0) {
                    await handleCreateSave({ note: '', category: 'REGULAR' });
                    return;
                  }
                  await handlePauseSave(parseHMToMinutes(createBuffer.pause || '00:00'));
                  onCreateCancel();
                }}
                onCancel={onCreateCancel}
                onChange={(v) => onUpdateCreateBuffer({ pause: v })}
                aria-label="Pause eingeben"
                shouldFocus={isCreating}
              />
              <button
                className={cn(
                  placeholderButtonClasses,
                  isCreating ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
                )}
                onClick={() => {
                  onStartCreating(date);
                  vibrate(8);
                }}
                aria-label="Neuen Eintrag erstellen"
              >
                --
              </button>
            </div>
          )}
        </td>

        {/* SOLL Column */}
        <td className="py-2 px-2 text-sm text-muted-foreground">
          {formatMinutesToHM(calculations.sollMinutes)}
        </td>

        {/* DIFF Column */}
        <td className={`py-2 px-2 text-sm font-medium ${calculations.diffMinutes < 0 ? 'text-destructive' : calculations.diffMinutes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
          {formatHoursDifference(calculations.diffMinutes)}
        </td>

      </tr>
    </>
  );
};

export const DayRow = memo(DayRowComponent);
