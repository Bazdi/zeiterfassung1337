/**
 * Refactored BookingsMonthView component using modular architecture
 */

"use client";

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Import error boundary and loading components
import { BookingsErrorBoundary } from './components/error-boundary';
import { FullPageLoading, TableSkeleton, MonthSelectorSkeleton } from './components/loading-states';

// Import our new modular components
import { MonthSelector } from './components/month-selector';
import { TableHeader } from './components/table-header';
import { DayRow } from './components/day-row';
import { WeekSummaryRow } from './components/week-summary-row';
import { MonthSummaryRow } from './components/month-summary-row';

// Import custom hooks
import { useTimeEntries } from './hooks/use-time-entries';
import { useEditingState } from './hooks/use-editing-state';
import { useHolidays } from './hooks/use-holidays';

// Import utilities
import { getDaysInMonth, getWeekLastDays, getISOWeekNumber } from './utils/date-helpers';
import { toISOString, formatMinutesToHM, calculateWorkingHoursForDay, parseHMToMinutes } from './utils/time-helpers';
import { validateTimeEntryData } from './utils/validation';

// Import types
import { BookingsMonthViewProps, CreateEntryBuffer, TimeEntry, WeekSummary } from './types';

export default function BookingsMonthView({
  initialYear,
  initialMonth
}: BookingsMonthViewProps) {
  const now = new Date();
  const [year, setYear] = useState(initialYear || now.getFullYear());
  const [month, setMonth] = useState(initialMonth || (now.getMonth() + 1));

  // State for day details dialog
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const [dupDate, setDupDate] = useState<string>("");

  // Custom hooks for data management
  const { entries, loading, createEntry, updateEntry } = useTimeEntries(year, month);
  const { holidays } = useHolidays(year, month);
  const { editing, startEditing, stopEditing, isEditing } = useEditingState();

  // Computed values
  const dayKeys = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const entry of entries) {
      const date = entry.start_utc.slice(0, 10);
      const dayEntries = map.get(date) || [];
      dayEntries.push(entry);
      map.set(date, dayEntries);
    }
    // Sort entries by start time
    for (const [, dayEntries] of map) {
      dayEntries.sort((a, b) => a.start_utc.localeCompare(b.start_utc));
    }
    return map;
  }, [entries]);

  const weekLastDays = useMemo(() => getWeekLastDays(year, month), [year, month]);

  const weekSummaries = useMemo(() => {
    const summaries = new Map<string, WeekSummary>();

    for (const day of dayKeys) {
      const weekKey = getISOWeekNumber(day).year + '-W' + String(getISOWeekNumber(day).week).padStart(2, '0');
      const dayEntries = byDay.get(day) || [];
      const dateObj = new Date(`${day}T00:00:00Z`);

      const ist = dayEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      const pause = dayEntries.reduce((sum, entry) => sum + (entry.pause_total_minutes || 0), 0);
      const soll = calculateWorkingHoursForDay(dateObj, holidays.get(day));

      const current = summaries.get(weekKey) || { ist: 0, pause: 0, soll: 0 };
      current.ist += ist;
      current.pause += pause;
      current.soll += soll;
      summaries.set(weekKey, current);
    }

    return summaries;
  }, [dayKeys, byDay, holidays]);

  // Event handlers
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    setSheetDay(null);
    stopEditing();
  };

  const handleSaveTime = async (day: string, field: 'start' | 'end', timeStr: string) => {
    const dayEntries = byDay.get(day) || [];
    if (dayEntries.length === 0) return;

    const targetEntry = field === 'start' ? dayEntries[0] : dayEntries[dayEntries.length - 1];
    const currentDuration = targetEntry.duration_minutes || 0;

    const updates: Partial<TimeEntry> = {};
    if (field === 'start') {
      const newStartIso = toISOString(day, timeStr);
      const newEndIso = new Date(new Date(newStartIso).getTime() + currentDuration * 60000).toISOString();
      updates.start_utc = newStartIso;
      updates.end_utc = newEndIso;
    } else {
      const newEndIso = toISOString(day, timeStr);
      const newStartIso = new Date(new Date(newEndIso).getTime() - currentDuration * 60000).toISOString();
      updates.start_utc = newStartIso;
      updates.end_utc = newEndIso;
    }

    await updateEntry(targetEntry.id, updates);
  };

  const handleSavePause = async (day: string, totalPause: number) => {
    const dayEntries = byDay.get(day) || [];
    if (dayEntries.length === 0) return;

    const firstEntry = dayEntries[0];
    const otherPause = dayEntries.slice(1).reduce((sum, entry) =>
      sum + (entry.pause_total_minutes || 0), 0
    );
    const newFirstPause = Math.max(0, totalPause - otherPause);

    await updateEntry(firstEntry.id, {
      start_utc: firstEntry.start_utc,
      pause_total_minutes: newFirstPause
    });
  };

  const handleSaveDuration = async (day: string, durationStr: string) => {
    const dayEntries = byDay.get(day) || [];
    const durationMinutes = parseHMToMinutes(durationStr);

    if (dayEntries.length > 0) {
      // Update existing entry: set end = start + duration
      const lastEntry = dayEntries[dayEntries.length - 1];
      const startTime = new Date(lastEntry.start_utc);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      const endIso = endTime.toISOString();

      await updateEntry(lastEntry.id, { end_utc: endIso });
    }
    // Create logic is now handled in DayRow
  };

  const handleCreateEntry = async (day: string, buffer: CreateEntryBuffer) => {
    const validation = validateTimeEntryData({
      start: buffer.start,
      end: buffer.end,
      pause: buffer.pause,
      note: buffer.note,
      category: buffer.category
    });

    if (!validation.isValid) {
      toast.error(`Validierungsfehler: ${validation.errors.join(', ')}`);
      return;
    }

    const payload = {
      start_utc: toISOString(day, buffer.start),
      end_utc: toISOString(day, buffer.end),
      pause_total_minutes: parseInt(buffer.pause || '0', 10) || 0,
      note: buffer.note || undefined,
      category: buffer.category
    };

    await createEntry(payload);
  };

  // Calculate month totals
  const monthTotals = useMemo(() => {
    let totalIst = 0;
    let totalPause = 0;
    let totalSoll = 0;

    for (const day of dayKeys) {
      const dayEntries = byDay.get(day) || [];
      const dateObj = new Date(`${day}T00:00:00Z`);

      totalIst += dayEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      totalPause += dayEntries.reduce((sum, entry) => sum + (entry.pause_total_minutes || 0), 0);
      totalSoll += calculateWorkingHoursForDay(dateObj, holidays.get(day));
    }

    return { totalIst, totalPause, totalSoll };
  }, [dayKeys, byDay, holidays]);

  if (loading) {
    return <FullPageLoading message="Lade Zeiteinträge..." />;
  }

  return (
    <AppShell
      title="Monatsansicht"
      heading="Monatsübersicht"
      description="Bearbeite tägliche Zeiten, Pausen und Notizen für den ausgewählten Monat."
      contentClassName="pb-24"
      actions={
        <MonthSelector
          year={year}
          month={month}
          onChange={handleMonthChange}
        />
      }
    >
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <TableHeader />

              <tbody>
                {dayKeys.map(day => {
                    const dayEntries = byDay.get(day) || [];
                    const weekKey = getISOWeekNumber(day).year + '-W' + String(getISOWeekNumber(day).week).padStart(2, '0');
                    const isLastOfWeek = weekLastDays.get(weekKey) === day;

                    return (
                      <React.Fragment key={day}>
                        <DayRow
                           date={day}
                           entries={dayEntries}
                           holidayName={holidays.get(day)}
                           isEditing={isEditing}
                           onStartEditing={startEditing}
                           onStopEditing={stopEditing}
                           onSaveTime={handleSaveTime}
                           onSavePause={handleSavePause}
                           onSaveDuration={handleSaveDuration}
                           onCreateSave={handleCreateEntry}
                           onShowDetails={(day) => {
                             setSheetDay(day);
                             setDupDate(day);
                           }}
                         />

                        {isLastOfWeek && (
                          <WeekSummaryRow
                            weekKey={weekKey}
                            summary={weekSummaries.get(weekKey)!}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>

              <tfoot>
                <MonthSummaryRow
                  totalIst={monthTotals.totalIst}
                  totalPause={monthTotals.totalPause}
                  totalSoll={monthTotals.totalSoll}
                />
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog - TODO: Extract to separate component */}
      <Dialog open={!!sheetDay} onOpenChange={(open) => { if (!open) setSheetDay(null) }}>
        <DialogContent className="max-w-2xl border bg-card text-card-foreground shadow-lg">
          <DialogHeader>
            <DialogTitle>Tag bearbeiten – {sheetDay}</DialogTitle>
          </DialogHeader>
          {sheetDay && (
            <div className="space-y-4">
              {/* Duplicate functionality - TODO: Extract */}
              <div className="text-sm text-muted-foreground">
                Details für {sheetDay} werden hier angezeigt...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
