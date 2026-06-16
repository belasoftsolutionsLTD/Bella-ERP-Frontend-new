import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display a number with commas, e.g. 50000 → "50,000" */
export function fmtNumber(n: number | string | null | undefined): string {
  const num = Number(n);
  if (isNaN(num)) return String(n ?? '');
  return num.toLocaleString('en-KE');
}

/** Display a currency value, e.g. 50000 → "KES 50,000" */
export function fmtCurrency(n: number | string | null | undefined): string {
  const num = Number(n);
  if (isNaN(num) || n === '' || n == null) return '—';
  return `KES ${num.toLocaleString('en-KE')}`;
}

/** Strip commas from a formatted string and return the raw number string */
export function parseCurrencyInput(s: string): string {
  return s.replace(/[^0-9]/g, '');
}
