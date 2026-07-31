'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { useDeals, useDeal } from '../Hooks/useDeals';
import { useContactSales } from '../Hooks/useContacts';
import { useTeamMembers } from '../Hooks/useTeamMembers';
import type { Deal, CrmAccessLevel } from '../types';

export function DealDetailDrawer({ deal, level, onClose }: { deal: Deal; level: CrmAccessLevel; onClose: () => void }) {
  const t = useTranslations('CRM');
  const { winDeal, loseDeal, reassignDeal } = useDeals({ pipelineId: deal.pipelineId });
  const { updateDeal } = useDeal(deal._id);
  const { sales } = useContactSales(deal.contactId);
  const { members } = useTeamMembers();
  const [showWin, setShowWin] = useState(false);
  const [confirmedSaleId, setConfirmedSaleId] = useState('');
  const [showLose, setShowLose] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [nextActionDesc, setNextActionDesc] = useState(deal.nextAction?.description || '');
  const [nextActionDue, setNextActionDue] = useState(deal.nextAction?.dueDate ? deal.nextAction.dueDate.split('T')[0] : '');
  const canReassign = level === 'admin' || level === 'manager';

  const saveNextAction = () => {
    updateDeal({ nextAction: nextActionDesc ? { description: nextActionDesc, dueDate: nextActionDue || null } : null });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold text-slate-900">{deal.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{t('deals.value')}</span>
            <span className="text-lg font-bold text-brand-primary">{deal.value.toLocaleString()} {deal.currency}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t('deals.contact')}</span>
            <span className="text-slate-800">{deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}</span>
          </div>
          {deal.expectedCloseDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t('deals.expectedCloseDate')}</span>
              <span className="text-slate-800">{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('deals.nextAction')}</p>
            <input value={nextActionDesc} onChange={(e) => setNextActionDesc(e.target.value)} placeholder={t('deals.nextActionPlaceholder')}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm" />
            <input type="date" value={nextActionDue} onChange={(e) => setNextActionDue(e.target.value)} className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm" />
            <button onClick={saveNextAction} className="text-xs text-brand-primary font-semibold">{t('common.save')}</button>
          </div>

          {canReassign && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t('deals.assignedTo')}</label>
              <select value={deal.assignedTo} onChange={(e) => reassignDeal(deal._id, e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
                {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {deal.status === 'open' && (
            <div className="flex gap-2">
              <button onClick={() => setShowWin(true)} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-emerald-500 text-white text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> {t('deals.markWon')}
              </button>
              <button onClick={() => setShowLose(true)} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold">
                <XCircle className="h-4 w-4" /> {t('deals.markLost')}
              </button>
            </div>
          )}
          {deal.status !== 'open' && (
            <p className={`text-sm font-semibold text-center py-2 rounded-lg ${deal.status === 'won' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {deal.status === 'won' ? t('deals.won') : t('deals.lost')}
            </p>
          )}

          {showWin && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700">{t('deals.confirmAgainstSale')}</p>
              <select value={confirmedSaleId} onChange={(e) => setConfirmedSaleId(e.target.value)} className="w-full h-9 border border-slate-200 rounded-lg px-2 text-sm">
                <option value="">{t('deals.noSaleToLink')}</option>
                {sales.map((s) => <option key={s._id} value={s._id}>{s.saleNumber} — {s.total.toLocaleString()}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowWin(false)} className="text-xs text-slate-400 px-2 py-1">{t('common.cancel')}</button>
                <button onClick={() => { winDeal(deal._id, confirmedSaleId || undefined); setShowWin(false); onClose(); }} className="text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-lg">
                  {t('deals.confirmWin')}
                </button>
              </div>
            </div>
          )}
          {showLose && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 space-y-2">
              <textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} rows={2} placeholder={t('deals.lostReasonPlaceholder')}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowLose(false)} className="text-xs text-slate-400 px-2 py-1">{t('common.cancel')}</button>
                <button onClick={() => { loseDeal(deal._id, lostReason || undefined); setShowLose(false); onClose(); }} className="text-xs font-semibold bg-red-500 text-white px-3 py-1.5 rounded-lg">
                  {t('deals.confirmLose')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
