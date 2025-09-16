/**
 * Table header component for the time entries table
 */

import React from 'react';

interface TableHeaderProps {
  className?: string;
}

export function TableHeader({ className = 'text-left text-muted-foreground border-b border-border bg-muted/40' }: TableHeaderProps) {
  return (
    <thead>
      <tr className={className}>
        <th className="py-2 px-2 font-semibold" scope="col">Tag</th>
        <th className="py-2 px-2 font-semibold" scope="col">Von</th>
        <th className="py-2 px-2 font-semibold" scope="col">Bis</th>
        <th className="py-2 px-2 font-semibold" scope="col">IST</th>
        <th className="py-2 px-2 font-semibold" scope="col">Pause</th>
        <th className="py-2 px-2 font-semibold" scope="col">SOLL</th>
        <th className="py-2 px-2 font-semibold" scope="col">DIFF</th>
      </tr>
    </thead>
  );
}
