'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNurtureCampaigns, useNurtureCandidates } from '../Hooks/useNurture';
import { useCandidates } from '../Hooks/useCandidates';
import type { TouchpointChannel } from '../types';

function NewCampaignForm({ onClose }: { onClose: () => void }) {
  const { createCampaign } = useNurtureCampaigns();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const submit = async () => {
    const result = await createCampaign({ name, description, targetTags: tags.split(',').map((t) => t.trim()).filter(Boolean) });
    if (result) onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Target tags (comma separated)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <Button size="sm" className="bg-primary text-white" onClick={submit} disabled={!name}>Create</Button>
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function CampaignPanel({ campaignId }: { campaignId: string }) {
  const { campaigns, addTouchpoint } = useNurtureCampaigns();
  const campaign = campaigns.find((c) => c._id === campaignId);
  const { candidates } = useCandidates({ tags: campaign?.targetTags.join(','), isPassiveTalent: true });
  const [candidateId, setCandidateId] = useState('');
  const [channel, setChannel] = useState<TouchpointChannel>('email');
  const [note, setNote] = useState('');

  if (!campaign) return null;

  const submitTouchpoint = async () => {
    if (!candidateId || !note) return;
    const result = await addTouchpoint(campaign._id, { candidateId, channel, note });
    if (result) setNote('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
        <p className="text-sm text-slate-500">{campaign.description}</p>
        <div className="flex gap-1.5 mt-2">
          {campaign.targetTags.map((t) => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Matched Candidates ({candidates.length})</h4>
        <div className="space-y-1">
          {candidates.map((c) => (
            <div key={c._id} className="flex items-center justify-between text-sm py-1">
              <span>{c.firstName} {c.lastName}</span>
              <span className="text-xs text-slate-400">{c.email}</span>
            </div>
          ))}
          {candidates.length === 0 && <p className="text-sm text-slate-400">No matched candidates yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Log a Touchpoint</h4>
        <div className="flex gap-2">
          <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select candidate</option>
            {candidates.map((c) => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value as TouchpointChannel)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="email">Email</option>
            <option value="linkedIn">LinkedIn</option>
            <option value="phone">Phone</option>
            <option value="event">Event</option>
          </select>
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you discuss?" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <Button size="sm" className="bg-primary text-white" onClick={submitTouchpoint}>Log Touchpoint</Button>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          {[...campaign.touchpoints].reverse().map((t, i) => (
            <div key={i} className="text-xs text-slate-500 flex justify-between">
              <span className="capitalize">{t.channel}: {t.note}</span>
              <span>{new Date(t.sentAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NurturePage({ locale }: { locale: string }) {
  const { campaigns } = useNurtureCampaigns();
  const { candidates: followUpQueue } = useNurtureCandidates();
  const [selected, setSelected] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Nurture CRM</h1>
          <p className="text-sm text-slate-400">Engage passive talent over time</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => setShowNew((s) => !s)}><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
      </div>

      {showNew && <NewCampaignForm onClose={() => setShowNew(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-brand-text-secondary">Campaigns</h2>
          {campaigns.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelected(c._id)}
              className={`w-full text-left bg-white rounded-lg border p-3 ${selected === c._id ? 'border-primary' : 'border-slate-200'}`}
            >
              <p className="text-sm font-medium text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-500">{c.matchedCandidateCount} matched · {c.status}</p>
            </button>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-slate-400">No campaigns yet.</p>}
        </div>

        <div className="lg:col-span-2">
          {selected ? <CampaignPanel campaignId={selected} /> : (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Follow-Up Queue</h2>
              <div className="divide-y divide-slate-100">
                {followUpQueue.map((c) => (
                  <div key={c._id} className="py-2 flex items-center justify-between text-sm">
                    <span>{c.firstName} {c.lastName}</span>
                    <span className="text-xs text-slate-400">
                      {c.lastTouchpointAt ? `Last contacted ${new Date(c.lastTouchpointAt).toLocaleDateString()}` : 'Never contacted'}
                    </span>
                  </div>
                ))}
                {followUpQueue.length === 0 && <p className="text-sm text-slate-400">No passive candidates yet.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
