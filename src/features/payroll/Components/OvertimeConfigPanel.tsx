'use client';
import { useState, useEffect, useCallback } from 'react';
import { Info, Save, Moon, Sun } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface OvertimeCfg {
  nightStart: string;
  nightEnd: string;
  weekdayDayRate: number;
  weekdayNightRate: number;
  weekendDayRate: number;
  weekendNightRate: number;
}

const RATE_FIELDS: { key: keyof OvertimeCfg; label: string; icon: React.ElementType; hint: string }[] = [
  { key: 'weekdayDayRate',   label: 'Weekday, Day',   icon: Sun,  hint: 'Mon–Fri, outside the night window' },
  { key: 'weekdayNightRate', label: 'Weekday, Night',  icon: Moon, hint: 'Mon–Fri, inside the night window' },
  { key: 'weekendDayRate',   label: 'Weekend, Day',    icon: Sun,  hint: 'Sat–Sun, outside the night window' },
  { key: 'weekendNightRate', label: 'Weekend, Night',  icon: Moon, hint: 'Sat–Sun, inside the night window' },
];

export function OvertimeConfigPanel() {
  const [cfg, setCfg]         = useState<OvertimeCfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/overtime-config`,
      showToast: false,
      thenFn: r => setCfg(r.data),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!cfg) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/config/overtime-config`,
      method: 'PUT',
      data: cfg,
      finallyFn: () => setSaving(false),
    });
  };

  const patch = (partial: Partial<OvertimeCfg>) => setCfg(prev => prev ? { ...prev, ...partial } : prev);

  if (loading || !cfg) {
    return <div className="py-16 text-center text-sm text-brand-text-muted">Loading…</div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3">
        <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
        <p className="text-xs text-brand-text">
          Overtime is paid at the employee&apos;s hourly rate × the multiplier for whichever bucket it falls
          into — set every rate yourself; there is no built-in default. A multiplier of 1 means no premium
          (paid at the normal hourly rate), 1.5 means time-and-a-half, 2 means double time, etc.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-brand-text">Night Window</h3>
        <p className="text-xs text-brand-text-secondary">Overtime worked inside this window counts as &quot;night&quot;; everything else counts as &quot;day&quot;.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-text-secondary">Night starts</label>
            <input type="time" value={cfg.nightStart} onChange={(e) => patch({ nightStart: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-text-secondary">Night ends</label>
            <input type="time" value={cfg.nightEnd} onChange={(e) => patch({ nightEnd: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-brand-text">Overtime Multipliers</h3>
        <div className="grid grid-cols-2 gap-4">
          {RATE_FIELDS.map(({ key, label, icon: Icon, hint }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-brand-text-secondary flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </label>
              <input
                type="number" step="0.05" min="0"
                value={cfg[key]}
                onChange={(e) => patch({ [key]: Number(e.target.value) } as Partial<OvertimeCfg>)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <p className="text-[11px] text-brand-text-muted">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Overtime Rates'}
      </button>
    </div>
  );
}
