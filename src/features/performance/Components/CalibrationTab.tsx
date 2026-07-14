'use client';

import { useState, useEffect } from 'react';
import { Loader2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useCycles } from '../Hooks/useCycles';
import { NINE_BOX_LABELS, NINE_BOX_GRID } from '../constants';

interface CalibEntry {
  employeeId: string;
  employee: { fullName: string; designation?: string; department?: string } | null;
  overallRating: number | null;
  calibrationBox: string;
  calibrationNotes: string;
  recommendation: string | null;
}

const X_LABELS = ['Low', 'Medium', 'High'];
const Y_LABELS = ['High', 'Medium', 'Low'];

export function CalibrationTab() {
  const [cycleId, setCycleId]   = useState('');
  const [data, setData]         = useState<CalibEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<CalibEntry | null>(null);
  const [moveBox, setMoveBox]   = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const { cycles } = useCycles();
  const activeCycles = cycles.filter(c => c.status === 'active' || c.status === 'calibration');

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/calibration/${cycleId}`,
      showToast: false,
      thenFn: r => setData(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [cycleId]);

  const dotsForBox = (box: string) => data.filter(e => e.calibrationBox === box);

  const handleSaveCalibration = () => {
    if (!selected || !cycleId) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/performance/calibration/${cycleId}/employee/${selected.employeeId}`,
      method: 'PUT',
      data: { box: moveBox || selected.calibrationBox, notes },
      thenFn: () => {
        setData(prev => prev.map(e => e.employeeId === selected.employeeId
          ? { ...e, calibrationBox: moveBox || e.calibrationBox, calibrationNotes: notes }
          : e
        ));
        setSaving(false);
        setSelected(null);
      },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Talent Calibration</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">9-Box talent grid — click an employee to update their position</p>
        </div>
        <select value={cycleId} onChange={e => setCycleId(e.target.value)}
          className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary">
          <option value="">Select review cycle…</option>
          {activeCycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {!cycleId ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-3">
          <LayoutGrid className="h-12 w-12" />
          <p className="text-brand-text-secondary font-semibold">Select an active review cycle to view the calibration grid</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="flex gap-4">
          {/* 9-box grid */}
          <div className="flex-1 overflow-auto">
            {/* X axis label */}
            <div className="flex mb-1 pl-8">
              <div className="flex-1 grid grid-cols-3 gap-1">
                {X_LABELS.map(l => (
                  <div key={l} className="text-center text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{l}</div>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-brand-text-muted mb-2">← Performance →</p>

            <div className="flex gap-2">
              {/* Y axis label */}
              <div className="flex flex-col justify-around w-7 shrink-0">
                {Y_LABELS.map(l => (
                  <div key={l} className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide -rotate-90 whitespace-nowrap">{l}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1">
                {NINE_BOX_GRID.flat().map((box) => {
                  const cfg  = NINE_BOX_LABELS[box];
                  const dots = dotsForBox(box);
                  return (
                    <div key={box} className={cn('rounded-xl p-3 min-h-[110px] flex flex-col border border-black/5', cfg.bgCls)}>
                      <p className={cn('text-[11px] font-bold mb-2', cfg.textCls)}>{cfg.label}</p>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {dots.map(e => (
                          <button
                            key={e.employeeId}
                            onClick={() => { setSelected(e); setMoveBox(e.calibrationBox); setNotes(e.calibrationNotes || ''); }}
                            title={e.employee?.fullName ?? 'Unknown'}
                            className={cn(
                              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow hover:scale-110 transition-transform',
                              'bg-brand-bg-muted hover:bg-brand-border-strong',
                            )}
                          >
                            {(e.employee?.fullName ?? '?').charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-[11px] text-brand-text-muted mt-1">↑ Potential ↑</p>

            {data.length === 0 && (
              <div className="text-center py-6 text-brand-text-muted text-sm">
                No manager reviews submitted for this cycle yet.
              </div>
            )}
          </div>

          {/* Selected employee panel */}
          {selected && (
            <div className="w-64 shrink-0 bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                  {(selected.employee?.fullName ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-text truncate">{selected.employee?.fullName ?? 'Unknown'}</p>
                  <p className="text-[11px] text-brand-text-secondary truncate">{selected.employee?.designation}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Current Box</span>
                  <span className="text-brand-text-secondary font-medium">{NINE_BOX_LABELS[selected.calibrationBox]?.label ?? selected.calibrationBox}</span>
                </div>
                {selected.overallRating != null && (
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Overall Rating</span>
                    <span className="text-brand-text-secondary font-medium">{selected.overallRating}/5</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-brand-text-muted uppercase tracking-wide">Move to Box</label>
                <select value={moveBox} onChange={e => setMoveBox(e.target.value)}
                  className="w-full h-8 mt-1 bg-white border border-brand-border rounded-lg px-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary">
                  {Object.entries(NINE_BOX_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-brand-text-muted uppercase tracking-wide">Session Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Calibration notes…"
                  className="w-full mt-1 bg-white border border-brand-border rounded-lg px-2 py-1.5 text-xs text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-1.5 rounded-lg border border-brand-border text-xs text-brand-text-secondary hover:text-brand-text transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveCalibration} disabled={saving}
                  className="flex-1 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
