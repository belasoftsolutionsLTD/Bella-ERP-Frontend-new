'use client';

import { cn } from '@/lib/utils';
import type { LeaveBalance } from '../constants';

const RING_R    = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

interface Props {
  balances: LeaveBalance[];
  loading?: boolean;
}

function BalanceRing({ used, total, color }: { used: number; total: number; color: string }) {
  const pct     = total > 0 ? Math.min(1, used / total) : 0;
  const offset  = RING_CIRC * (1 - pct);
  const remaining = Math.max(0, total - used);

  return (
    <div className="relative mx-auto w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={RING_R} fill="none" stroke="#334155" strokeWidth="6" />
        <circle cx="40" cy="40" r={RING_R} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-100 leading-none">{remaining}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">days left</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 animate-pulse" style={{ borderTop: '3px solid #334155' }}>
      <div className="h-3 w-24 bg-slate-700 rounded mb-4" />
      <div className="h-20 w-20 rounded-full bg-slate-700 mx-auto mb-4" />
      <div className="flex justify-between">
        <div className="h-3 w-16 bg-slate-700 rounded" />
        <div className="h-3 w-16 bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export function LeaveBalanceCards({ balances, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 text-center text-slate-500 text-sm">
        No leave balances configured. Contact HR to set up your leave entitlements.
      </div>
    );
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {balances.map((b) => (
        <div key={b.leaveType}
          className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
          style={{ borderTop: `3px solid ${b.color}` }}>

          {/* Name */}
          <p className="text-[13px] font-bold text-slate-100 mb-4 truncate">{b.leaveTypeName}</p>

          {/* Ring */}
          <BalanceRing used={b.usedDays} total={b.totalDays} color={b.color} />

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/60">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">{b.usedDays}</p>
              <p className="text-[10px] text-slate-500">Used</p>
            </div>
            {b.pendingDays > 0 && (
              <div className="text-center">
                <p className="text-xs font-bold text-amber-400">{b.pendingDays}</p>
                <p className="text-[10px] text-slate-500">Pending</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">{b.totalDays}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
          </div>

          {/* Accrual chip */}
          {b.nextAccrualDate && b.nextAccrualDays && (
            <div className="mt-2 flex items-center gap-1 bg-emerald-900/30 border border-emerald-700/30 rounded-full px-2 py-0.5">
              <span className="text-emerald-400 text-[10px] font-semibold">
                +{b.nextAccrualDays} days accruing {b.nextAccrualDate}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
