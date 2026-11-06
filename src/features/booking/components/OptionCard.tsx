import type { ReactNode } from 'react';
import { CheckIcon } from '@/components/ui/icons';

interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
}

/** Radio button rendered as a card. Keyboard and screen-reader behaviour comes from the native input. */
export default function OptionCard({ name, value, checked, onSelect, children }: OptionCardProps) {
  return (
    <label className="option-card">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      {children}
      <span className="option-check">
        <CheckIcon className="size-3.5" />
      </span>
    </label>
  );
}
