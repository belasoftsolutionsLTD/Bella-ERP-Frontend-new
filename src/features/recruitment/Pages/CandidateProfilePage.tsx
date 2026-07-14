'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCandidate } from '../Hooks/useCandidates';
import { useNurtureCampaigns } from '../Hooks/useNurture';
import { useRequisitions } from '../Hooks/useRequisitions';
import { SOURCE_LABELS, APPLICATION_STATUS_MAP } from '../constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function CandidateProfilePage({ id, locale }: { id: string; locale: string }) {
  const { candidate, isLoading, updateCandidate, convertCandidate } = useCandidate(id);
  const { campaigns } = useNurtureCampaigns();
  const { requisitions } = useRequisitions({ status: 'open' });
  const [tab, setTab] = useState<'overview' | 'applications' | 'touchpoints' | 'notes'>('overview');
  const [notes, setNotes] = useState('');
  const [convertTo, setConvertTo] = useState('');

  if (isLoading || !candidate) return <div className="p-6 text-sm text-brand-text-secondary">Loading...</div>;

  const touchpoints = campaigns
    .flatMap((c) => (c.touchpoints || []).filter((t) => String(t.candidateId) === id).map((t) => ({ ...t, campaignName: c.name })))
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">{candidate.firstName} {candidate.lastName}</h1>
          <p className="text-sm text-brand-text-secondary">{SOURCE_LABELS[candidate.source]}{candidate.isPassiveTalent ? ' · Passive Talent' : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 text-sm text-brand-text-muted">
        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {candidate.email}</span>
        {candidate.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {candidate.phone}</span>}
        {candidate.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {candidate.location}</span>}
        {candidate.resumeUrl && (
          <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Resume
          </a>
        )}
      </div>

      <div className="flex gap-1 border-b border-brand-border">
        {(['overview', 'applications', 'touchpoints', 'notes'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-brand-text-secondary'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {candidate.tags.map((t) => <span key={t} className="text-xs bg-slate-100 text-brand-text-muted px-2 py-0.5 rounded-full">{t}</span>)}
          </div>
          {candidate.isPassiveTalent && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <select value={convertTo} onChange={(e) => setConvertTo(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Move into requisition...</option>
                {requisitions.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
              </select>
              <Button size="sm" className="bg-primary text-white" disabled={!convertTo} onClick={() => convertCandidate(convertTo)}>
                Convert to Active
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {candidate.applications?.length ? candidate.applications.map((a) => (
            <Link key={a._id} href={`/${locale}/recruitment/requisitions/${a.requisitionId}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">{a.requisition?.title ?? 'Requisition'}</p>
                <p className="text-xs text-brand-text-muted">{a.requisition?.department}</p>
              </div>
              <StatusBadge status={APPLICATION_STATUS_MAP[a.status]} label={a.status} />
            </Link>
          )) : <p className="p-6 text-sm text-brand-text-secondary text-center">No applications yet.</p>}
        </div>
      )}

      {tab === 'touchpoints' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {touchpoints.length ? touchpoints.map((t, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800 capitalize">{t.channel}</span>
                <span className="text-xs text-brand-text-secondary">{new Date(t.sentAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-brand-text-muted mt-1">{t.campaignName}</p>
              <p className="text-sm text-brand-text-muted mt-1">{t.note}</p>
            </div>
          )) : <p className="p-6 text-sm text-brand-text-secondary text-center">No touchpoints logged.</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <textarea
            defaultValue={candidate.notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Internal notes about this candidate..."
          />
          <Button size="sm" className="bg-primary text-white" onClick={() => updateCandidate({ notes })}>Save Notes</Button>
        </div>
      )}
    </div>
  );
}
