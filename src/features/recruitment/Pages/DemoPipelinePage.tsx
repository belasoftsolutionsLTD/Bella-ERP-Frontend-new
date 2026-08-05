'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, X, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/configs/constants';
import { STAGE_TYPE_STYLES, SOURCE_LABELS } from '../constants';
import type { Application, JobRequisition } from '../types';

// Read-only sales-demo view of the Recruitment pipeline, backed entirely by fake
// seeded data (see backend/src/lib/demo/seedDemoRecruitment.js). Deliberately its
// own isolated page/token, not the real (hr) shell or AuthContext — a guest here
// never becomes a "logged in" user of the real app, and this page never imports
// or calls any endpoint that can mutate data.
interface PipelineData {
  requisition: JobRequisition;
  applications: (Application & { candidate: { firstName: string; lastName: string; source: keyof typeof SOURCE_LABELS } | null })[];
  byStage: Record<string, PipelineData['applications']>;
}

const fmtSalary = (min: number, max: number, currency: string) =>
  `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;

export default function DemoPipelinePage({ locale }: { locale: string }) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<PipelineData['applications'][number] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const loginRes = await fetch(`${API_BASE_URL}/demo/login`, { method: 'POST' });
        const loginJson = await loginRes.json();
        if (!loginJson.success) throw new Error(loginJson.message);
        const token = loginJson.data.token as string;

        const pipelineRes = await fetch(`${API_BASE_URL}/demo/pipeline`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pipelineJson = await pipelineRes.json();
        if (!pipelineJson.success) throw new Error(pipelineJson.message);
        setData(pipelineJson.data);
      } catch {
        setError(true);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-[10px]">HR</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">Workfola</span>
            <span className="ml-1.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> Live Demo
            </span>
          </div>
          <Link href={`/${locale}/login`} className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-1.5 rounded-lg transition-colors">
            Sign in
          </Link>
        </div>
      </div>

      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-2.5 text-xs text-orange-800">
          You&apos;re browsing a sample Recruitment pipeline with fictional candidates — nothing here is real company data. Want this for your team?{' '}
          <Link href={`/${locale}/login`} className="font-semibold underline underline-offset-2">Get in touch</Link>.
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <p className="text-sm text-red-500 text-center py-16">Couldn&apos;t load the demo right now. Please try again shortly.</p>
        )}

        {!data && !error && (
          <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
        )}

        {data && (
          <>
            <div className="mb-5">
              <h1 className="text-xl font-semibold text-slate-900">{data.requisition.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {data.requisition.department} · {data.requisition.location} · {fmtSalary(data.requisition.salaryRange.min, data.requisition.salaryRange.max, data.requisition.salaryRange.currency)}
              </p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4">
              {data.requisition.pipelineStages.map((stage) => (
                <div key={stage.id} className="flex flex-col w-72 shrink-0">
                  <div className={`rounded-t-lg border px-3 py-2 ${STAGE_TYPE_STYLES[stage.type]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{stage.name}</span>
                      <span className="text-xs font-medium">{(data.byStage[stage.id] ?? []).length}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[160px] space-y-2 p-2 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                    {(data.byStage[stage.id] ?? []).map((app) => (
                      <button
                        key={app._id}
                        onClick={() => setSelected(app)}
                        className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 p-3 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}` : 'Candidate'}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{app.candidate ? SOURCE_LABELS[app.candidate.source] : ''}</span>
                          {app.overallScore != null && <span>Score: {app.overallScore.toFixed(1)}/5</span>}
                        </div>
                      </button>
                    ))}
                    {(data.byStage[stage.id] ?? []).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No candidates</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selected && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">
                {selected.candidate ? `${selected.candidate.firstName} ${selected.candidate.lastName}` : 'Candidate'}
              </h2>
              <button onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="text-slate-400">Source:</span> {selected.candidate ? SOURCE_LABELS[selected.candidate.source] : '—'}</p>
              <p><span className="text-slate-400">Stage:</span> {data.requisition.pipelineStages.find((s) => s.id === selected.currentStageId)?.name}</p>
              {selected.overallScore != null && <p><span className="text-slate-400">Score:</span> {selected.overallScore.toFixed(1)}/5</p>}
              {selected.offerDetails && (
                <p><span className="text-slate-400">Offer:</span> {selected.offerDetails.currency} {selected.offerDetails.salary.toLocaleString()} ({selected.offerDetails.status})</p>
              )}
              {selected.rejectionReason && <p><span className="text-slate-400">Rejection reason:</span> {selected.rejectionReason}</p>}
            </div>
            <p className="text-xs text-slate-400 mt-4">This is a read-only preview. Sign in with a real account to move candidates, assign interviewers, and more.</p>
          </div>
        </div>
      )}
    </div>
  );
}
