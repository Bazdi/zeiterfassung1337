/**
 * Table header component for the time entries table
 */

import React from 'react';

interface TableHeaderProps {
  className?: string;
}

export function TableHeader({ className = 'text-left text-gray-600 border-b' }: TableHeaderProps) {
  return (
    <thead>
      <tr className={className}>
        <th className="py-2 px-2" scope="col">Tag</th>
        <th className="py-2 px-2" scope="col">Von</th>
        <th className="py-2 px-2" scope="col">Bis</th>
        <th className="py-2 px-2" scope="col">IST</th>
        <th className="py-2 px-2" scope="col">Pause</th>
        <th className="py-2 px-2" scope="col">SOLL</th>
        <th className="py-2 px-2" scope="col">DIFF</th>
      </tr>
    </thead>
  );
}