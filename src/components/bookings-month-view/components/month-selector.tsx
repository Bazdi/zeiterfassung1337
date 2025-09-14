/**
 * Month selector component for navigating between months
 */

import React from 'react';
import { Input } from '@/components/ui/input';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  className?: string;
}

export function MonthSelector({
  year,
  month,
  onChange,
  className = 'flex items-center gap-3 mb-3'
}: MonthSelectorProps) {
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [newYear, newMonth] = e.target.value.split('-').map(v => parseInt(v, 10));
    if (!isNaN(newYear) && !isNaN(newMonth)) {
      onChange(newYear, newMonth);
    }
  };

  return (
    <div className={className}>
      <Input
        type="month"
        value={`${year}-${String(month).padStart(2, '0')}`}
        onChange={handleMonthChange}
        className="w-auto"
        aria-label="Monat und Jahr auswählen"
      />
    </div>
  );
}