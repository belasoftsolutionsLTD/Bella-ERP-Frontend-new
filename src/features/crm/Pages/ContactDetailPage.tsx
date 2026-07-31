'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { useContact, useContactTimeline } from '../Hooks/useContacts';
import { useCrmAccess } from '../Hooks/useCrmAccess';
import { TimelineFeed } from '../Components/TimelineFeed';
import { StockSearchWidget } from '../Components/StockSearchWidget';
import { LogActivityModal } from '../Components/LogActivityModal';
import { DealFormModal } from '../Components/DealFormModal';
import { ContactFormModal } from '../Components/ContactFormModal';
import { FeedbackPanel } from '../Components/FeedbackPanel';
import { usePipelines } from '../Hooks/useCrmConfig';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';

export function ContactDetailPage({ id }: { id: string }) {
  const t = useTranslations('CRM');
  const locale = useLocale();
  const router = useRouter();
  const { level } = useCrmAccess();
  const { contact, isLoading, deleteContact } = useContact(id);
  const { timeline, isLoading: timelineLoading, mutate: mutateTimeline } = useContactTimeline(id);
  const { pipelines } = usePipelines();
  const [showLog, setShowLog] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = level === 'admin' || level === 'manager';

  const handleDelete = () => {
    setDeleting(true);
    deleteContact()?.then(() => { router.push(`/${locale}/crm?tab=contacts`); }).catch(() => setDeleting(false));
  };

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!contact) return <div className="p-6 text-sm text-slate-400">{t('common.notFound')}</div>;

  const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <Link href={`/${locale}/crm?tab=contacts`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {t('nav.contacts')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{contact.firstName} {contact.lastName}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
              {contact.email && <span>{contact.email}</span>}
              {contact.phone && <span>{contact.phone}</span>}
              {contact.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {contact.company.name}</span>}
            </div>
            {contact.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {contact.tags.map((tag) => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
              <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
            </button>
            {canDelete && (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => setShowDealForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
              <Plus className="h-4 w-4" /> {t('deals.addDeal')}
            </button>
            <button onClick={() => setShowLog(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
              <Plus className="h-4 w-4" /> {t('activities.logActivity')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">{t('timeline.title')}</h2>
          {timelineLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : <TimelineFeed entries={timeline} />}
        </div>

        <div className="space-y-4">
          {(contact.deals?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('nav.pipeline')}</p>
              <div className="space-y-2">
                {contact.deals!.map((d) => (
                  <div key={d._id} className="text-sm">
                    <p className="text-slate-800 truncate">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.value.toLocaleString()} · <span className="capitalize">{d.status}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <FeedbackPanel contactId={contact._id} />
          <StockSearchWidget />
        </div>
      </div>

      {showLog && <LogActivityModal contactId={contact._id} onClose={() => setShowLog(false)} onLogged={() => mutateTimeline()} />}
      {showDealForm && defaultPipeline && <DealFormModal pipeline={defaultPipeline} defaultContactId={contact._id} onClose={() => setShowDealForm(false)} />}
      {showEdit && <ContactFormModal contact={contact} onClose={() => setShowEdit(false)} />}
      {showDeleteConfirm && (
        <ConfirmDialog
          title={t('contacts.deleteContact')}
          message={t('contacts.deleteContactConfirm')}
          confirmLabel={deleting ? t('common.saving') : t('common.delete')}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
