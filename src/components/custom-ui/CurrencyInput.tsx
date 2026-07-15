'use client';

import { cn, parseCurrencyInput } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;           // raw digits, no commas (e.g. "50000")
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function CurrencyInput({ value, onChange, placeholder = '0', className, required }: CurrencyInputProps) {
  // Display: add commas.  Storage: raw digits only.
  const display = value ? Number(value).toLocaleString('en-KE') : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrencyInput(e.target.value);
    onChange(raw);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground/40 select-none pointer-events-none">
        KES
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          'h-10 w-full border border-brand-border rounded-xl pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all',
          className
        )}
      />
    </div>
  );
}
