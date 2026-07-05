'use client';

import Link from 'next/link';
import { Briefcase, Users, Send, UserCheck, ArrowRight } from 'lucide-react';
import { useRecruitmentOverview } from '../Hooks/useAnalytics';
import { useRequisitions } from '../Hooks/useRequisitions';
import { REQUISITION_STATUS_LABELS } from '../constants';

function StatTile({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function RecruitmentDashboardPage({ locale }: { locale: string }) {
  const { overview, isLoading } = useRecruitmentOverview();
  const { requisitions } = useRequisitions({ status: 'pendingApproval' });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Recruitment</h1>
        <p className="text-sm text-slate-400">Structured hiring, from requisition to offer.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Briefcase} label="Open Requisitions" value={isLoading ? '-' : overview?.openRequisitions ?? 0} />
        <StatTile icon={Users} label="Active Candidates" value={isLoading ? '-' : overview?.activeCandidates ?? 0} />
        <StatTile icon={Send} label="Offers Pending" value={isLoading ? '-' : overview?.offersOut ?? 0} />
        <StatTile icon={UserCheck} label="Hires This Month" value={isLoading ? '-' : overview?.hiresThisMonth ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { href: 'requisitions', label: 'Requisitions', desc: 'Create and manage job openings' },
          { href: 'candidates', label: 'Candidates', desc: 'Browse the candidate database' },
          { href: 'nurture', label: 'Nurture CRM', desc: 'Engage passive talent' },
          { href: 'analytics', label: 'Analytics', desc: 'Funnel, time-to-fill, and more' },
          { href: 'settings', label: 'Settings', desc: 'Email templates and interview kits' },
        ].map((item) => (
          <Link key={item.href} href={`/${locale}/recruitment/${item.href}`} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary/40 hover:shadow-sm transition flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>

      {requisitions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Awaiting Your Approval</h2>
          <div className="space-y-2">
            {requisitions.map((r) => (
              <Link key={r._id} href={`/${locale}/recruitment/requisitions/${r._id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <span className="text-sm text-slate-700">{r.title} — {r.department}</span>
                <span className="text-xs font-medium text-amber-600">{REQUISITION_STATUS_LABELS[r.status]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
