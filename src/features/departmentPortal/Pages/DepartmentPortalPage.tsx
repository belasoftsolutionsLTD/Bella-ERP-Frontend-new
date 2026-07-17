'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, CalendarClock, HelpCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface TeamMember {
  _id: string; fullName: string; staffNumber: string; designation: string;
  status: 'active' | 'on_leave' | 'suspended'; email: string; phone?: string;
}

interface DeptStats { total: number; present: number; absent: number; onLeave: number; notMarked: number }

interface LeaveRequest {
  _id: string; startDate: string; endDate: string; totalDays: number; reason: string | null; status: string;
  employee: { fullName: string; staffNumber: string; designation: string } | null;
  leaveType: { name: string; color?: string } | null;
}

const EMP_STATUS_MAP: Record<string, Status> = { active: 'active', on_leave: 'onLeave', suspended: 'suspended' };

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

function StatTile({ label, value, icon: Icon, colorCls }: { label: string; value: number; icon: React.ElementType; colorCls: string }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', colorCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-bold text-brand-text leading-none">{value}</p>
        <p className="text-[11px] text-brand-text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

// The Department Head Portal — a team-management view distinct from the generic
// self-service Staff Portal every role otherwise shares. Backed by GET /me/department
// (team roster + today's attendance, already existed server-side but nothing in the
// frontend called it) and GET /leave/requests?status=pending (already auto-scopes to
// the caller's team for department_head — see leaveFunctions.js's getScopedEmployeeIds).
export default function DepartmentPortalPage() {
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<DeptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingLeave, setPendingLeave] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchTeam = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/me/department`, showToast: false,
      thenFn: (r) => { setDepartment(r.data?.department ?? ''); setTeam(r.data?.employees ?? []); setStats(r.data?.stats ?? null); },
      catchFn: (e: any) => setError(e?.message || 'Failed to load your department.'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const fetchPendingLeave = useCallback(() => {
    setLeaveLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests?status=pending&limit=50`, showToast: false,
      thenFn: (r) => setPendingLeave(r.data?.data ?? []),
      finallyFn: () => setLeaveLoading(false),
    });
  }, []);

  useEffect(() => { fetchTeam(); fetchPendingLeave(); }, [fetchTeam, fetchPendingLeave]);

  const approve = (id: string) => {
    setActingId(id);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/approve`, method: 'PATCH',
      thenFn: () => fetchPendingLeave(),
      finallyFn: () => setActingId(null),
    });
  };

  const reject = (id: string) => {
    if (!rejectReason.trim()) return;
    setActingId(id);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/reject`, method: 'PATCH',
      data: { rejectionReason: rejectReason.trim() },
      thenFn: () => { setRejectingId(null); setRejectReason(''); fetchPendingLeave(); },
      finallyFn: () => setActingId(null),
    });
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center space-y-2">
        <HelpCircle className="h-6 w-6 text-brand-text-muted mx-auto" />
        <p className="text-sm text-brand-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">{department} Department</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Your team, today's attendance, and pending leave approvals</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Team Size" value={stats.total} icon={Users} colorCls="bg-brand-primary/15 text-brand-primary" />
          <StatTile label="Present Today" value={stats.present} icon={UserCheck} colorCls="bg-status-success-bg text-status-success-text" />
          <StatTile label="Absent Today" value={stats.absent} icon={UserX} colorCls="bg-status-danger-bg text-status-danger-text" />
          <StatTile label="On Leave" value={stats.onLeave} icon={CalendarClock} colorCls="bg-status-warning-bg text-status-warning-text" />
        </div>
      )}

      {/* Pending Leave Approvals */}
      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border/60">
          <h2 className="text-sm font-bold text-brand-text">Pending Leave Requests</h2>
        </div>
        {leaveLoading ? (
          <div className="py-10 flex justify-center"><div className="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
        ) : pendingLeave.length === 0 ? (
          <div className="py-10 text-center text-sm text-brand-text-muted">No pending leave requests for your team.</div>
        ) : (
          <div className="divide-y divide-brand-border/60">
            {pendingLeave.map((lr) => (
              <div key={lr._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{lr.employee?.fullName ?? 'Unknown employee'}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {lr.leaveType?.name ?? 'Leave'} · {fmtDate(lr.startDate)} – {fmtDate(lr.endDate)} · {lr.totalDays} day{lr.totalDays !== 1 ? 's' : ''}
                    </p>
                    {lr.reason && <p className="text-xs text-brand-text-secondary mt-1">"{lr.reason}"</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => approve(lr._id)} disabled={actingId === lr._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success-bg text-status-success-text text-xs font-bold hover:opacity-80 disabled:opacity-40 transition-opacity">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => setRejectingId(rejectingId === lr._id ? null : lr._id)} disabled={actingId === lr._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-danger-bg text-status-danger-text text-xs font-bold hover:opacity-80 disabled:opacity-40 transition-opacity">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
                {rejectingId === lr._id && (
                  <div className="mt-3 flex items-center gap-2">
                    <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection…"
                      className="flex-1 h-9 px-3 bg-white border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                    <button onClick={() => reject(lr._id)} disabled={!rejectReason.trim() || actingId === lr._id}
                      className="px-3 h-9 rounded-lg bg-brand-primary text-white text-xs font-bold disabled:opacity-40 transition-colors">
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Roster */}
      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border/60">
          <h2 className="text-sm font-bold text-brand-text">Team Roster</h2>
        </div>
        {team.length === 0 ? (
          <div className="py-10 text-center text-sm text-brand-text-muted">No team members found for your department.</div>
        ) : (
          <div className="divide-y divide-brand-border/60">
            {team.map((m) => (
              <div key={m._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-[11px] font-bold text-brand-primary shrink-0">
                    {m.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{m.fullName}</p>
                    <p className="text-[11px] text-brand-text-muted">{m.designation} · {m.staffNumber}</p>
                  </div>
                </div>
                <StatusBadge status={EMP_STATUS_MAP[m.status] ?? 'active'} className="py-1 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
