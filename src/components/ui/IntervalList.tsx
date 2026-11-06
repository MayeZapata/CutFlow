import React from 'react';

interface IntervalListProps {
  intervals: string[];
}

export default function IntervalList({ intervals }: IntervalListProps) {
  return (
    <ul className="space-y-1 max-h-60 overflow-y-auto">
      {intervals.map((item, idx) => (
        <li
          key={idx}
          className="flex items-center justify-between bg-amber-500/10 border-l-4 border-amber-400 p-2 rounded"
        >
          <span>{item}</span>
          <span className="text-amber-400 font-medium">Validado O(log n)</span>
        </li>
      ))}
    </ul>
  );
}
