/**
 * Refactored BookingsMonthView component using modular architecture
 */

"use client";

import React, { useState, useMemo } from 'react';
import AppHeader from '@/components/app-header';
import MobileTabbar from '@/components/mobile-tabbar';
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
import { toISOString, formatMinutesToHM, calculateWorkingHoursForDay } from './utils/time-helpers';
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

  // State for creating new entries
  const [creatingDay, setCreatingDay] = useState<string | null>(null);
  const [createBuffer, setCreateBuffer] = useState<CreateEntryBuffer>({
    start: "08:00",
    end: "16:00",
    pause: "0",
    note: "",
    category: "REGULAR"
  });

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
    setCreatingDay(null);
    setSheetDay(null);
    stopEditing();
  };

  const handleSaveTime = async (day: string, field: 'start' | 'end', timeStr: string) => {
    const dayEntries = byDay.get(day) || [];
    if (dayEntries.length === 0) return;

    const targetEntry = field === 'start' ? dayEntries[0] : dayEntries[dayEntries.length - 1];
    const isoTime = toISOString(day, timeStr);

    const updates: Partial<TimeEntry> = {};
    if (field === 'start') {
      updates.start_utc = isoTime;
      if (targetEntry.end_utc) {
        updates.end_utc = targetEntry.end_utc;
      }
    } else {
      updates.end_utc = isoTime;
      updates.start_utc = targetEntry.start_utc;
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

    const success = await createEntry(payload);
    if (success) {
      setCreatingDay(null);
      setCreateBuffer({
        start: "08:00",
        end: "16:00",
        pause: "0",
        note: "",
        category: "REGULAR"
      });
    }
  };

  const handleStartCreating = (day: string) => {
    setCreatingDay(day);
    setCreateBuffer({
      start: "08:00",
      end: "16:00",
      pause: "0",
      note: "",
      category: "REGULAR"
    });
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
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Monatsansicht" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-[env(safe-area-inset-bottom)]">
        <Card>
          <CardContent className="pt-4">
            <MonthSelector
              year={year}
              month={month}
              onChange={handleMonthChange}
            />

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
                          isCreating={creatingDay === day}
                          createBuffer={createBuffer}
                          onStartCreating={handleStartCreating}
                          onCreateSave={handleCreateEntry}
                          onCreateCancel={() => setCreatingDay(null)}
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
      </main>

      <MobileTabbar />

      {/* Day Details Dialog - TODO: Extract to separate component */}
      <Dialog open={!!sheetDay} onOpenChange={(open) => { if (!open) setSheetDay(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tag bearbeiten – {sheetDay}</DialogTitle>
          </DialogHeader>
          {sheetDay && (
            <div className="space-y-4">
              {/* Duplicate functionality - TODO: Extract */}
              <div className="text-sm text-gray-600">
                Details für {sheetDay} werden hier angezeigt...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}