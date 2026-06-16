'use client';

import { useState } from 'react';
import { MapPin, Wifi, WifiOff, X } from 'lucide-react';
import { AttendanceCell } from './AttendanceCell';
import type { AttendanceGroup, AttendanceRecord } from '../Hooks/useAttendance';

// Detail popover shown when clicking a cell
function RecordDetail({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-5 w-72 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">{record.date}</p>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-foreground/40">Clock In</p>
            <p className="font-bold">{record.checkInTime || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-foreground/40">Clock Out</p>
            <p className="font-bold">{record.checkOutTime || '—'}</p>
          </div>
        </div>
        {record.checkInTime && record.checkOutTime && (() => {
          const [ih, im] = record.checkInTime.split(':').map(Number);
          const [oh, om] = record.checkOutTime.split(':').map(Number);
          const mins = Math.max(0, oh * 60 + om - (ih * 60 + im));
          const h = Math.floor(mins / 60), m = mins % 60;
          const pct = Math.min(100, Math.round((mins / 480) * 100));
          const col = mins >= 480 ? 'bg-emerald-500' : mins >= 360 ? 'bg-amber-400' : 'bg-rose-400';
          return (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground/50">Hours worked</span>
                <span className="font-bold text-foreground">{h}h {m > 0 ? `${m}m` : ''}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${col}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-foreground/30 text-right">{pct}% of 8h standard</p>
            </div>
          );
        })()}

        {record.mode && (
          <div className="flex items-center gap-2">
            {record.mode === 'offsite'
              ? <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              : <Wifi className="h-3.5 w-3.5 text-primary" />
            }
            <span className={`text-xs font-semibold ${record.mode === 'offsite' ? 'text-amber-700' : 'text-primary'}`}>
              {record.mode === 'offsite' ? 'Off-Site' : 'On-Site'}
            </span>
            {record.selfMarked && (
              <span className="ml-auto text-[10px] text-foreground/40 bg-gray-100 px-1.5 py-0.5 rounded-full">Self-marked</span>
            )}
          </div>
        )}

        {record.checkInLocation && (
          <div className="flex items-start gap-1.5 bg-amber-50 rounded-lg p-2">
            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-foreground/40">Check-in location</p>
              <p className="font-medium text-amber-800">{record.checkInLocation}</p>
            </div>
          </div>
        )}
        {record.checkOutLocation && record.checkOutLocation !== record.checkInLocation && (
          <div className="flex items-start gap-1.5 bg-amber-50 rounded-lg p-2">
            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-foreground/40">Check-out location</p>
              <p className="font-medium text-amber-800">{record.checkOutLocation}</p>
            </div>
          </div>
        )}
        {record.checkInLat && record.checkInLng && (
          <a
            href={`https://maps.google.com/?q=${record.checkInLat},${record.checkInLng}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" /> View on Google Maps
          </a>
        )}
        {record.notes && <p className="text-xs text-foreground/50 italic">"{record.notes}"</p>}
      </div>
    </div>
  );
}

export function AttendanceGrid({ data, month, year }: { data: AttendanceGroup[]; month: number; year: number }) {
  const [detail, setDetail] = useState<AttendanceRecord | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (data.length === 0) {
    return <p className="text-sm text-foreground/50 py-8 text-center">No attendance records for this period.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="text-xs">
          <thead className="bg-primary/5 border-b">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold sticky left-0 bg-primary/5 min-w-[160px] z-10">
                Employee
              </th>
              {days.map((d) => (
                <th key={d} className="px-1 py-2.5 text-center w-9 font-medium text-foreground/60">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((group) => {
              const byDate: Record<number, AttendanceRecord> = {};
              group.records.forEach((r) => {
                byDate[parseInt(r.date.split('-')[2])] = r;
              });

              const hasOffsite = group.records.some(r => r.mode === 'offsite');

              return (
                <tr key={String(group.employeeId)} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <p className="font-semibold text-foreground leading-tight">
                          {group.employeeName || `…${String(group.employeeId).slice(-6)}`}
                        </p>
                        {group.staffNumber && (
                          <p className="text-[10px] text-foreground/40">{group.staffNumber}</p>
                        )}
                      </div>
                      {hasOffsite && (
                        <span title="Has off-site records">
                          <WifiOff className="h-3 w-3 text-amber-500 shrink-0 ml-1" />
                        </span>
                      )}
                    </div>
                  </td>
                  {days.map((d) => {
                    const rec = byDate[d];
                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        <button
                          onClick={() => rec && setDetail(rec)}
                          className={rec ? 'cursor-pointer' : 'cursor-default'}
                          title={rec ? `${rec.status}${rec.checkInTime ? ` · in ${rec.checkInTime}` : ''}${rec.mode === 'offsite' ? ' · off-site' : ''}` : undefined}
                        >
                          <AttendanceCell status={rec?.status} offsite={rec?.mode === 'offsite'} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
        {[
          { label: 'Present',  cls: 'bg-success/20 text-success',      char: 'P' },
          { label: 'Absent',   cls: 'bg-danger/20 text-danger',        char: 'A' },
          { label: 'Late',     cls: 'bg-warning/20 text-yellow-700',   char: 'L' },
          { label: 'Half Day', cls: 'bg-blue-100 text-blue-700',       char: 'H' },
          { label: 'Remote',   cls: 'bg-purple-100 text-purple-700',   char: 'R' },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1 text-[10px] text-foreground/50">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${s.cls}`}>{s.char}</span>
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-foreground/50 ml-1">
          <WifiOff className="h-3 w-3 text-amber-500" /> Off-site record
        </span>
        <span className="text-[10px] text-foreground/40 ml-auto italic">Click any cell for details</span>
      </div>

      {detail && <RecordDetail record={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
