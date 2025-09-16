/**
 * Week summary row component for displaying weekly totals
 */

import React, { memo } from 'react';
import { WeekSummary } from '../types';
import { formatMinutesToHM, formatHoursDifference } from '../utils/time-helpers';

interface WeekSummaryRowProps {
  weekKey: string;
  summary: WeekSummary;
  className?: string;
}

const WeekSummaryRowComponent: React.FC<WeekSummaryRowProps> = ({
  weekKey,
  summary,
  className = 'bg-muted/30 border-b border-border'
}) => {
  const diff = summary.ist - summary.soll;

  return (
    <tr className={className}>
      <td className="py-2 px-2 text-sm text-muted-foreground" colSpan={1}>
        Woche {weekKey.split('W')[1]}
      </td>
      <td colSpan={2}></td>
      <td className="py-2 px-2 font-medium text-foreground">
        {formatMinutesToHM(summary.ist)}
      </td>
      <td className="py-2 px-2 text-foreground">
        {formatMinutesToHM(summary.pause)}
      </td>
      <td className="py-2 px-2 text-foreground">
        {formatMinutesToHM(summary.soll)}
      </td>
      <td className={`py-2 px-2 font-medium ${diff < 0 ? 'text-destructive' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
        {formatHoursDifference(diff)}
      </td>
    </tr>
  );
};

export const WeekSummaryRow = memo(WeekSummaryRowComponent);
