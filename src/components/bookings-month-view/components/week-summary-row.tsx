/**
 * Week summary row component for displaying weekly totals
 */

import React from 'react';
import { WeekSummary } from '../types';
import { formatMinutesToHM, formatHoursDifference } from '../utils/time-helpers';

interface WeekSummaryRowProps {
  weekKey: string;
  summary: WeekSummary;
  className?: string;
}

export function WeekSummaryRow({
  weekKey,
  summary,
  className = 'bg-gray-50/60 border-b'
}: WeekSummaryRowProps) {
  const diff = summary.ist - summary.soll;

  return (
    <tr className={className}>
      <td className="py-2 px-2 text-sm text-gray-700" colSpan={1}>
        Woche {weekKey.split('W')[1]}
      </td>
      <td colSpan={2}></td>
      <td className="py-2 px-2 font-medium">
        {formatMinutesToHM(summary.ist)}
      </td>
      <td className="py-2 px-2">
        {formatMinutesToHM(summary.pause)}
      </td>
      <td className="py-2 px-2">
        {formatMinutesToHM(summary.soll)}
      </td>
      <td className={`py-2 px-2 ${diff < 0 ? 'text-red-700' : diff > 0 ? 'text-green-700' : 'text-gray-700'}`}>
        {formatHoursDifference(diff)}
      </td>
    </tr>
  );
}