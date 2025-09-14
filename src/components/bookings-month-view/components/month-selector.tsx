/**
 * Month selector component for navigating between months
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  className?: string;
}

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export function MonthSelector({
  year,
  month,
  onChange,
  className = 'flex items-center gap-3 mb-3'
}: MonthSelectorProps) {
  const currentYear = new Date().getFullYear();

  const handleValueChange = (value: string) => {
    const [newYear, newMonth] = value.split('-').map(v => parseInt(v, 10));
    if (!isNaN(newYear) && !isNaN(newMonth)) {
      onChange(newYear, newMonth);
    }
  };

  const options = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      options.push({
        value: `${y}-${String(m).padStart(2, '0')}`,
        label: `${monthNames[m - 1]} ${y}`
      });
    }
  }

  return (
    <div className={className}>
      <Select
        value={`${year}-${String(month).padStart(2, '0')}`}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[200px]" aria-label="Monat und Jahr auswählen">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}