'use client';

import { Download, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Matches the established convention from WorkforceAnalyticsPage.tsx / AttendancePage.tsx
// analytics tabs — reused here so every Reports page looks consistent with the rest of
// the HR-admin side of the app instead of inventing a new visual language.
export const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

export function ChartCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-brand-text">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="font-semibold" style={{ color: p.color ?? p.payload?.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export function StatTile({ label, value, colorCls = 'text-indigo-400', icon: Icon }: { label: string; value: React.ReactNode; colorCls?: string; icon?: React.ElementType }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
      <p className={cn('text-2xl font-bold flex items-center justify-center gap-1.5', colorCls)}>
        {Icon && <Icon className="h-4 w-4" />} {value}
      </p>
      <p className="text-xs text-brand-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

export function LoadingBlock() {
  return <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>;
}

export function ErrorBlock({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="h-6 w-6 text-brand-danger" />
      <p className="text-sm text-brand-text-secondary">{message || 'Failed to load this report.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

// Client-side CSV export of already-fetched rows — matches the pattern already
// established by the legacy reports page rather than round-tripping to the backend
// /reports/export endpoint for data the page already has in memory.
export function exportRowsAsCSV(rows: Array<Record<string, any>>, filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object' || rows[0][k] === null);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => {
      const v = row[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    }).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function ExportCSVButton({ rows, filename }: { rows: Array<Record<string, any>> | undefined; filename: string }) {
  return (
    <button
      onClick={() => rows && exportRowsAsCSV(rows, filename)}
      disabled={!rows?.length}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary text-xs font-semibold disabled:opacity-40 transition-colors"
    >
      <Download className="h-3.5 w-3.5" /> Export CSV
    </button>
  );
}
