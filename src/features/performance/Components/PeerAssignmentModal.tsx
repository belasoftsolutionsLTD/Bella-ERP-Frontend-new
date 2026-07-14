'use client';

import { useMemo, useState } from 'react';
import { X, Users } from 'lucide-react';
import { useEmployees } from '@/features/employees/Hooks/useEmployees';
import { useCycles } from '../Hooks/useCycles';
import type { ReviewCycle } from '../constants';

interface Props {
  cycle: ReviewCycle;
  onClose: () => void;
}

export function PeerAssignmentModal({ cycle, onClose }: Props) {
  const { employees } = useEmployees({ limit: 1000 });
  const { assignPeers } = useCycles();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(cycle.participants[0]?.employeeId ?? '');
  const [saving, setSaving] = useState(false);

  const participant = cycle.participants.find((p) => p.employeeId === selectedEmployeeId);
  const empMap = useMemo(() => new Map(employees.map((e) => [e._id, e])), [employees]);

  const currentPeers: string[] = (participant as unknown as { peersAssigned?: { peerId: string }[] })?.peersAssigned?.map((pa) => pa.peerId) ?? [];
  const [selectedPeers, setSelectedPeers] = useState<Set<string>>(new Set(currentPeers));

  const selectParticipant = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const p = cycle.participants.find((pp) => pp.employeeId === employeeId);
    const peers = (p as unknown as { peersAssigned?: { peerId: string }[] })?.peersAssigned?.map((pa) => pa.peerId) ?? [];
    setSelectedPeers(new Set(peers));
  };

  const togglePeer = (id: string) => setSelectedPeers((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = () => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    assignPeers(cycle._id, selectedEmployeeId, [...selectedPeers], () => setSaving(false), () => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text flex items-center gap-2"><Users className="h-4 w-4" /> Assign Peer Reviewers</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">{cycle.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex">
          <div className="w-1/3 border-r border-brand-border overflow-y-auto">
            {cycle.participants.map((p) => (
              <button key={p.employeeId} onClick={() => selectParticipant(p.employeeId)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-brand-border transition-colors ${selectedEmployeeId === p.employeeId ? 'bg-brand-primary/10 text-indigo-300' : 'text-brand-text-secondary hover:bg-brand-bg-soft'}`}>
                {empMap.get(p.employeeId)?.fullName ?? p.employeeId}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-xs text-brand-text-muted mb-2">Select colleagues who should submit a peer review for this person:</p>
            {employees.filter((e) => e._id !== selectedEmployeeId).map((e) => (
              <label key={e._id} className="flex items-center gap-2 py-1.5 text-sm text-brand-text-secondary cursor-pointer">
                <input type="checkbox" checked={selectedPeers.has(e._id)} onChange={() => togglePeer(e._id)} />
                {e.fullName}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text">Close</button>
          <button type="button" onClick={handleSave} disabled={saving || !selectedEmployeeId}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Peers'}
          </button>
        </div>
      </div>
    </div>
  );
}
