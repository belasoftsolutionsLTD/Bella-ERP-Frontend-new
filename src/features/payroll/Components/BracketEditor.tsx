'use client';
import { Plus, Trash2 } from 'lucide-react';

export interface Bracket { limit: number | null; rate: number }

interface BracketEditorProps {
  brackets: Bracket[];
  onChange: (brackets: Bracket[]) => void;
  title?: string;
  widthLabel?: string;
  valueLabel?: string;
  addLabel?: string;
  emptyLabel?: string;
}

// Shared tiered/marginal-band editor — a list of {limit, rate} rows where each row's
// `limit` is the WIDTH consumed at that rate (not a cumulative ceiling). Used by both
// Tax Config (PAYE-style brackets) and payroll Concepts (the "bracket" calculation
// type) so both share one tested UI instead of two near-identical tables drifting
// apart over time. The two stay functionally independent — this component only
// edits the `brackets` array it's given, it doesn't know or care which system owns it.
export function BracketEditor({
  brackets, onChange,
  title = 'Bands',
  widthLabel = 'Width of this band',
  valueLabel = 'Rate (%)',
  addLabel = 'Add band',
  emptyLabel = 'No bands — add one above.',
}: BracketEditorProps) {
  const updateBracket = (i: number, key: keyof Bracket, val: string) => {
    const next = brackets.map((b, idx) =>
      idx === i ? { ...b, [key]: key === 'limit' ? (val === '' ? null : parseFloat(val)) : parseFloat(val) } : b
    );
    onChange(next);
  };

  const addBracket = () => onChange([...brackets, { limit: null, rate: 0 }]);
  const removeBracket = (i: number) => onChange(brackets.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">{title}</p>
        <button onClick={addBracket} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          <Plus className="h-3 w-3" /> {addLabel}
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">{widthLabel}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">Applies to (range)</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">{valueLabel}</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {(() => {
              let runningFrom = 0;
              return brackets.map((b, i) => {
                const from = runningFrom;
                const to = b.limit ? from + b.limit : null;
                runningFrom = to ?? from;
                return (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <input type="number" value={b.limit ?? ''} onChange={e => updateBracket(i, 'limit', e.target.value)}
                        placeholder="No limit (top band)"
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground/60 whitespace-nowrap">
                      {from === 0
                        ? (to != null ? `Up to ${to.toLocaleString()}` : 'All amounts')
                        : (to != null ? `Over ${from.toLocaleString()}, up to ${to.toLocaleString()}` : `Over ${from.toLocaleString()}`)}
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={b.rate} onChange={e => updateBracket(i, 'rate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeBracket(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              });
            })()}
            {brackets.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-foreground/30 text-xs">{emptyLabel}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
