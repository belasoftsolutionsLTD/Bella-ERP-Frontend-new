'use client';

import { useState } from 'react';
import {
  Search, Mail, Phone, Briefcase, CalendarDays,
  ChevronRight, Loader2, Users, UserCheck, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaffPortal, type StaffEmployee } from '../Hooks/useStaffPortal';
import { MyPortalView } from '../Components/MyPortalView';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';

type DetailTab = 'profile' | 'leave' | 'attendance';

const EMPLOYEE_STATUS_MAP: Record<string, Status> = {
  active: 'active', on_leave: 'onLeave', suspended: 'suspended', terminated: 'terminated',
};

const AVATAR_COLORS = [
  'from-rose-500 to-pink-600',   'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',   'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-500','from-fuchsia-500 to-pink-600',
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-bold', sizeClass, avatarColor(name))}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function StaffPortalPage() {
  const { isStaff, isDeptHead, authLoading } = useAuth();

  if (authLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
    </div>
  );

  if (isStaff || isDeptHead) return <MyPortalView />;

  return <HrStaffPortalView />;
}

function HrStaffPortalView() {
  const { employees, listLoading, search, setSearch, total, hasMore, loadMore, selectedId, selectEmployee, detail } = useStaffPortal();
  const [detailTab, setDetailTab] = useState<DetailTab>('profile');

  const activeCount = employees.filter(e => e.status === 'active').length;
  const onLeaveCount = employees.filter(e => e.status === 'on_leave').length;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)]">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-primary to-[#1a3461] p-5 text-white shadow-lg flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Staff Portal</h1>
            <p className="text-white/60 text-sm mt-0.5">Search by name or Staff ID to pull up any employee's records</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-white/60 text-xs">Total Staff</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-300">{activeCount}</p>
            <p className="text-white/60 text-xs">Active</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">{onLeaveCount}</p>
            <p className="text-white/60 text-xs">On Leave</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left panel */}
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or Staff ID…"
                className="w-full pl-9 pr-3 h-9 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Employee list */}
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-foreground/40 gap-2">
                <UserCheck className="h-8 w-8" />
                <p className="text-xs">No employees found.</p>
              </div>
            ) : (
              employees.map((emp) => {
                const isSelected = selectedId === emp._id;
                return (
                  <button
                    key={emp._id}
                    onClick={() => { selectEmployee(emp); setDetailTab('profile'); }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all duration-150 border-b border-gray-50 hover:bg-gray-50',
                      isSelected && 'bg-primary/5 border-l-3 border-l-primary'
                    )}
                  >
                    <Avatar name={emp.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-foreground/50 truncate">{emp.designation}</p>
                      <StatusBadge status={EMPLOYEE_STATUS_MAP[emp.status] ?? 'inactive'} className="mt-0.5" />
                    </div>
                    <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isSelected ? 'text-primary translate-x-0.5' : 'text-foreground/20')} />
                  </button>
                );
              })
            )}
          </div>

          {hasMore && (
            <div className="px-3 py-2 border-t">
              <button
                onClick={loadMore}
                disabled={listLoading}
                className="w-full text-xs font-semibold text-primary hover:text-primary/80 py-1.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {listLoading ? 'Loading…' : `Load more (${total - employees.length} remaining)`}
              </button>
            </div>
          )}
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-foreground/40 font-medium">
            {search ? `${employees.length} of ${total} staff` : `${total} staff member${total !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
          {!detail.profile ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
                <Users className="h-10 w-10 text-primary/30" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground/50">No employee selected</p>
                <p className="text-sm text-foreground/30 mt-1">Pick a name from the list to view their full record</p>
              </div>
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div className="bg-gradient-to-r from-primary to-[#1a3461] px-6 py-5 flex items-start gap-4 shrink-0">
                <Avatar name={detail.profile.fullName} size="lg" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{detail.profile.fullName}</h2>
                  <p className="text-white/70 text-sm mt-0.5">{detail.profile.designation} · {detail.profile.department}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-mono bg-white/20 text-white px-2.5 py-1 rounded-lg">
                      {detail.profile.staffNumber}
                    </span>
                    <StatusBadge status={EMPLOYEE_STATUS_MAP[detail.profile.status] ?? 'inactive'} />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-3 pb-0 border-b shrink-0">
                {([
                  { key: 'profile', label: 'Profile', icon: UserCheck },
                  { key: 'leave', label: 'Leave', icon: CalendarDays },
                  { key: 'attendance', label: 'Attendance', icon: Clock },
                ] as { key: DetailTab; label: string; icon: typeof UserCheck }[]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                      detailTab === key
                        ? 'border-accent text-primary'
                        : 'border-transparent text-foreground/50 hover:text-foreground hover:border-gray-200'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-5">
                {detail.loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <>
                    {detailTab === 'profile' && <ProfileView emp={detail.profile} />}
                    {detailTab === 'leave' && (
                      <LeaveView
                        balance={detail.leaveBalance}
                        requests={detail.leaveRequests as any[]}
                      />
                    )}
                    {detailTab === 'attendance' && <AttendanceView records={detail.attendance as any[]} />}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color = 'text-primary' }: {
  icon: typeof Mail; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 hover:bg-gray-50 transition-colors">
      <div className={cn('h-8 w-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

function ProfileView({ emp }: { emp: StaffEmployee }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <InfoCard icon={Mail}         label="Email"           value={emp.email || '—'}         color="text-blue-600" />
      <InfoCard icon={Phone}        label="Phone"           value={emp.phone || '—'}         color="text-green-600" />
      <InfoCard icon={Briefcase}    label="Department"      value={emp.department || '—'}    color="text-violet-600" />
      <InfoCard icon={UserCheck}    label="Employment Type" value={emp.employmentType || '—'} color="text-amber-600" />
      <InfoCard icon={CalendarDays} label="Date of Hire"    value={emp.dateOfHire ? new Date(emp.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-rose-600" />
    </div>
  );
}

const LEAVE_COLORS = [
  'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-fuchsia-500 to-violet-600',
];

function LeaveView({ balance, requests }: { balance: any; requests: any[] }) {
  const balances: any[] = Array.isArray(balance) ? balance : [];
  return (
    <div className="space-y-6">
      {balances.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Leave Balances</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {balances.map((b, i) => (
              <div key={b._id} className={cn('rounded-xl bg-gradient-to-br p-4 text-white shadow-sm', LEAVE_COLORS[i % LEAVE_COLORS.length])}>
                <p className="text-xs font-semibold text-white/70">{b.leaveType?.name ?? 'Leave'}</p>
                <p className="text-3xl font-bold mt-1">{b.closingBalance}</p>
                <p className="text-xs text-white/60 mt-0.5">days remaining</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {requests.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Recent Leave Requests</h4>
          <div className="space-y-2">
            {requests.slice(0, 10).map((r: any) => (
              <div key={r._id} className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium">{r.leaveType?.name ?? 'Leave'}</span>
                <span className="text-xs text-foreground/40">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</span>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                  r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700')}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {balances.length === 0 && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-2">
          <CalendarDays className="h-10 w-10" />
          <p className="text-sm">No leave records found.</p>
        </div>
      )}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  present: 'bg-emerald-500', absent: 'bg-red-500',
  late: 'bg-amber-500', halfDay: 'bg-orange-400', remote: 'bg-blue-500',
};
const STATUS_ROW: Record<string, string> = {
  present: 'border-l-emerald-400', absent: 'border-l-red-400',
  late: 'border-l-amber-400', halfDay: 'border-l-orange-400', remote: 'border-l-blue-400',
};

function AttendanceView({ records }: { records: any[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-2">
        <Clock className="h-10 w-10" />
        <p className="text-sm">No attendance records found.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {records.slice(0, 30).map((r: any, i: number) => (
        <div key={r._id ?? i} className={cn(
          'flex items-center justify-between rounded-xl border border-l-4 px-4 py-3 hover:bg-gray-50 transition-colors',
          STATUS_ROW[r.status] || 'border-l-gray-300'
        )}>
          <span className="text-sm text-foreground/70 font-medium">{r.date}</span>
          <div className="flex items-center gap-2">
            {r.checkIn && <span className="text-xs text-foreground/40">In: {r.checkIn}</span>}
            {r.checkOut && <span className="text-xs text-foreground/40">Out: {r.checkOut}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[r.status] || 'bg-gray-300')} />
            <span className="text-sm capitalize font-medium">{r.status?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
