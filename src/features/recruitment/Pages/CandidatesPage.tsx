'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCandidates } from '../Hooks/useCandidates';
import { AddCandidateModal } from '../Components/AddCandidateModal';
import { SOURCE_LABELS } from '../constants';

export function CandidatesPage({ locale }: { locale: string }) {
  const [source, setSource] = useState('');
  const [passiveOnly, setPassiveOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { candidates, isLoading } = useCandidates({ source: source || undefined, isPassiveTalent: passiveOnly || undefined });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Candidates</h1>
          <p className="text-sm text-brand-text-secondary">Candidate database and talent pool</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add Candidate</Button>
      </div>

      <div className="flex gap-3 items-center">
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border border-brand-border bg-brand-bg-soft text-brand-text px-3 py-2 text-sm">
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-brand-text-secondary">
          <input type="checkbox" checked={passiveOnly} onChange={(e) => setPassiveOnly(e.target.checked)} /> Passive talent only
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-brand-text-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Source</th>
              <th className="text-left px-4 py-2">Tags</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/${locale}/recruitment/candidates/${c._id}`} className="text-primary hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-brand-text-muted">{c.email}</td>
                <td className="px-4 py-2 text-brand-text-muted">{SOURCE_LABELS[c.source]}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map((t) => <span key={t} className="text-xs bg-slate-100 text-brand-text-muted px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {c.isPassiveTalent ? <span className="text-xs text-purple-600">Passive</span> : <span className="text-xs text-blue-600">Active</span>}
                </td>
              </tr>
            ))}
            {!isLoading && candidates.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-text-secondary">No candidates found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddCandidateModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
