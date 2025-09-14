/**
 * Day row component for displaying and editing a single day's time entries
 */

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TimeEntry, CreateEntryBuffer, TimeEntryCategory } from '../types';
import { EditableTimeCell } from '../cells/editable-time-cell';
import { EditablePauseCell } from '../cells/editable-pause-cell';
import { NotesCell } from '../cells/notes-cell';
import {
  formatMinutesToHM,
  formatHoursDifference,
  calculateWorkingHoursForDay,
  vibrate
} from '../utils/time-helpers';
import { getWeekKey, formatDateForDisplay } from '../utils/date-helpers';

interface DayRowProps {
  date: string;
  entries: TimeEntry[];
  holidayName?: string;
  isEditing: (day: string, field: 'start' | 'end' | 'pause') => boolean;
  onStartEditing: (day: string, field: 'start' | 'end' | 'pause', value: string) => void;
  onStopEditing: () => void;
  onSaveTime: (day: string, field: 'start' | 'end', value: string) => Promise<void>;
  onSavePause: (day: string, value: number) => Promise<void>;
  isCreating: boolean;
  createBuffer: CreateEntryBuffer;
  onStartCreating: (day: string) => void;
  onCreateSave: (day: string, buffer: CreateEntryBuffer) => Promise<void>;
  onCreateCancel: () => void;
  onShowDetails: (day: string) => void;
}

export const DayRow: React.FC<DayRowProps> = ({
  date,
  entries,
  holidayName,
  isEditing,
  onStartEditing,
  onStopEditing,
  onSaveTime,
  onSavePause,
  isCreating,
  createBuffer,
  onStartCreating,
  onCreateSave,
  onCreateCancel,
  onShowDetails
}) => {
  const dateObj = new Date(`${date}T00:00:00Z`);
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
  const weekKey = getWeekKey(date);

  const handleTimeSave = async (field: 'start' | 'end', value: string) => {
    await onSaveTime(date, field, value);
    onStopEditing();
  };

  const handlePauseSave = async (value: number) => {
    await onSavePause(date, value);
    onStopEditing();
  };

  const handleCreateSave = async (data: { note: string; category: TimeEntryCategory }) => {
    const buffer = { ...createBuffer, ...data };
    await onCreateSave(date, buffer);
  };

  return (
    <>
      <tr className={`border-b ${isWeekend ? 'bg-gray-50' : ''} ${holidayName ? 'bg-blue-50/40' : ''}`}>
        {/* Day Column */}
        <td className="py-3 px-2 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200"
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
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                Wochenende
              </span>
            )}
            {holidayName && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800"
                title={holidayName}
              >
                Feiertag
              </span>
            )}
            {calculations.representativeCategory && calculations.representativeCategory !== 'REGULAR' && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
                title={calculations.representativeCategory}
              >
                {calculations.representativeCategory}
              </span>
            )}
          </div>
        </td>

        {/* Start Time Column */}
        <td className="py-2 px-2">
          {isEditing(date, 'start') ? (
            <EditableTimeCell
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
              className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200"
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
          ) : isCreating ? (
            <EditableTimeCell
              value={createBuffer.start}
              onSave={() => Promise.resolve()} // Handled by create save
              onCancel={onCreateCancel}
              aria-label="Startzeit eingeben"
            />
          ) : null}
        </td>

        {/* End Time Column */}
        <td className="py-2 px-2">
          {isEditing(date, 'end') ? (
            <EditableTimeCell
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
              className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200"
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
          ) : isCreating ? (
            <EditableTimeCell
              value={createBuffer.end}
              onSave={() => Promise.resolve()} // Handled by create save
              onCancel={onCreateCancel}
              aria-label="Endzeit eingeben"
            />
          ) : null}
        </td>

        {/* IST Column */}
        <td className="py-2 px-2 font-medium">
          {formatMinutesToHM(calculations.totalMinutes)}
        </td>

        {/* Pause Column */}
        <td className="py-2 px-2">
          {isEditing(date, 'pause') ? (
            <EditablePauseCell
              value={calculations.pauseTotal}
              onSave={handlePauseSave}
              onCancel={onStopEditing}
              aria-label="Pause bearbeiten"
            />
          ) : (
            <button
              className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200"
              onClick={() => {
                onStartEditing(date, 'pause', String(calculations.pauseTotal));
                vibrate(8);
              }}
              aria-label={`Pause ${formatMinutesToHM(calculations.pauseTotal)} bearbeiten`}
            >
              {formatMinutesToHM(calculations.pauseTotal)}
            </button>
          )}
        </td>

        {/* SOLL Column */}
        <td className="py-2 px-2">
          {formatMinutesToHM(calculations.sollMinutes)}
        </td>

        {/* DIFF Column */}
        <td className={`py-2 px-2 ${calculations.diffMinutes < 0 ? 'text-red-700' : calculations.diffMinutes > 0 ? 'text-green-700' : 'text-gray-700'}`}>
          {formatHoursDifference(calculations.diffMinutes)}
        </td>

        {/* Notes Column */}
        <td className="py-2 px-2 text-gray-700 max-w-[360px]">
          <NotesCell
            notes={entries.map(e => e.note).filter(Boolean).filter((note): note is string => note !== null)}
            category={calculations.representativeCategory}
            isCreating={isCreating}
            onCreateSave={handleCreateSave}
            onCreateCancel={onCreateCancel}
          />
        </td>

        {/* Action Column */}
        <td className="py-2 px-2 text-right">
          {isCreating ? (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onCreateCancel();
                  vibrate(6);
                }}
                aria-label="Erstellung abbrechen"
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={() => handleCreateSave({ note: createBuffer.note, category: createBuffer.category })}
                aria-label="Eintrag erstellen"
              >
                Speichern
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-9"
              onClick={() => {
                onStartCreating(date);
                vibrate(8);
              }}
              aria-label="Neuen Eintrag erstellen"
            >
              Neu
            </Button>
          )}
        </td>
      </tr>
    </>
  );
};