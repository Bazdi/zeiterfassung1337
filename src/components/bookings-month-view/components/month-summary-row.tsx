/**
 * Month summary row component for displaying monthly totals
 */

import React, { memo } from 'react';
import { formatMinutesToHM, formatHoursDifference } from '../utils/time-helpers';

interface MonthSummaryRowProps {
  totalIst: number;
  totalPause: number;
  totalSoll: number;
  className?: string;
}

const MonthSummaryRowComponent: React.FC<MonthSummaryRowProps> = ({
  totalIst,
  totalPause,
  totalSoll,
  className = 'border-t border-border bg-muted/40'
}) => {
  const diff = totalIst - totalSoll;

  return (
    <tr className={className}>
      <td className="py-2 px-2 font-semibold text-foreground" colSpan={3}>
        Monatssummen
      </td>
      <td className="py-2 px-2 font-semibold text-foreground">
        {formatMinutesToHM(totalIst)}
      </td>
      <td className="py-2 px-2 text-foreground">
        {formatMinutesToHM(totalPause)}
      </td>
      <td className="py-2 px-2 text-foreground">
        {formatMinutesToHM(totalSoll)}
      </td>
      <td className={`py-2 px-2 font-semibold ${diff < 0 ? 'text-destructive' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
        {formatHoursDifference(diff)}
      </td>
    </tr>
  );
};

export const MonthSummaryRow = memo(MonthSummaryRowComponent);
