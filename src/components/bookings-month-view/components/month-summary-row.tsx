/**
 * Month summary row component for displaying monthly totals
 */

import React from 'react';
import { formatMinutesToHM, formatHoursDifference } from '../utils/time-helpers';

interface MonthSummaryRowProps {
  totalIst: number;
  totalPause: number;
  totalSoll: number;
  className?: string;
}

export function MonthSummaryRow({
  totalIst,
  totalPause,
  totalSoll,
  className = 'border-t bg-gray-50'
}: MonthSummaryRowProps) {
  const diff = totalIst - totalSoll;

  return (
    <tr className={className}>
      <td className="py-2 px-2 font-semibold" colSpan={3}>
        Monatssummen
      </td>
      <td className="py-2 px-2 font-semibold">
        {formatMinutesToHM(totalIst)}
      </td>
      <td className="py-2 px-2">
        {formatMinutesToHM(totalPause)}
      </td>
      <td className="py-2 px-2">
        {formatMinutesToHM(totalSoll)}
      </td>
      <td className={`py-2 px-2 font-semibold ${diff < 0 ? 'text-red-700' : diff > 0 ? 'text-green-800' : 'text-gray-700'}`}>
        {formatHoursDifference(diff)}
      </td>
    </tr>
  );
}