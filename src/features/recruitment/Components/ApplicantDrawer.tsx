'use client';

import { useState } from 'react';
import { X, Mail, Phone, Calendar, FileText, UserCheck, UserX, ExternalLink, CalendarClock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { parseCurrencyInput } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const UPLOADS_URL = API_BASE_URL.replace(/\/api$/, '/uploads');
import { STAGE_CONFIG, STAGES, SOURCE_CONFIG, stageCfg } from '../constants';
import type { Applicant } from '../Hooks/useRecruitment';

type ProfileTab = 'overview' | 'notes' | 'interview' | 'stage';

interface Props {
  applicant: Applicant;
  onClose: () => void;
  onStageChange: (stage: string, extra?: Record<string, unknown>) => void;
  onSendOfferLetter: (data: { offeredSalary?: number; startDate?: string }) => void;
  onReject?: () => void;
  onHire?: () => void;
  onRefetch?: () => void;
}

export function ApplicantDrawer({ applicant, onClose, onStageChange, onSendOfferLetter, onReject, onHire, onRefetch }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [offeredSalary, setOfferedSalary] = useState(parseCurrencyInput(applicant.offeredSalary?.toString() ?? ''));
  const [startDate, setStartDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  const cfg = stageCfg(applicant.stage);
  const srcCfg = SOURCE_CONFIG[applicant.source ?? ''] ?? SOURCE_CONFIG.other;
  const appliedDate = applicant.appliedAt ? new Date(applicant.appliedAt) : new Date(applicant.createdAt);
  const sched = applicant.interviewSchedule;

  const handleAddNote = () => {
    if (!note.trim()) return;
    setAddingNote(true);
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${applicant._id}/note`,
      method: 'POST',
      data: { note: note.trim() },
      thenFn: () => { setNote(''); onRefetch?.(); },
      finallyFn: () => setAddingNote(false),
    });
  };

  const handleScheduleInterview = () => {
    if (!interviewDate || !interviewTime) return;
    setSchedulingInterview(true);
    apiCallFunction({
      url: `${API_BASE_URL}/hr/interviews`,
      method: 'POST',
      data: {
        applicantId: applicant._id,
        interviewerId: applicant._id,
        scheduledDate: interviewDate,
        scheduledTime: interviewTime,
        location: interviewLocation || undefined,
      },
      thenFn: () => { onRefetch?.(); setInterviewDate(''); setInterviewTime(''); setInterviewLocation(''); },
      finallyFn: () => setSchedulingInterview(false),
    });
  };

  const inp = 'h-10 border border-gray-200 rounded-xl px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-200';

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'overview',  label: 'Overview'   },
    { key: 'notes',     label: 'Notes'      },
    { key: 'interview', label: 'Interview'  },
    { key: 'stage',     label: 'Stage'      },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{applicant.fullName}</h2>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', cfg.bgCls, cfg.textCls, cfg.borderCls)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{applicant.positionTitle ?? 'No position assigned'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Left sidebar */}
          <div className="w-52 border-r border-gray-100 px-4 py-4 flex-shrink-0 overflow-y-auto space-y-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${applicant.email}`}
                  className="hover:text-indigo-600 truncate text-xs text-slate-600 transition-colors">
                  {applicant.email}
                </a>
              </div>
              {applicant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${applicant.phone}`} className="text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                    {applicant.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-600">
                  {appliedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {applicant.source && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Source</p>
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', srcCfg.cls)}>
                  {srcCfg.label}
                </span>
              </div>
            )}

            {(applicant.cvPath || applicant.cvFilename) && (
              <div className="pt-3 border-t border-gray-100">
                <a
                  href={`${UPLOADS_URL}/${applicant.cvFilename ?? 'cv.pdf'}?token=${typeof window !== 'undefined' ? sessionStorage.getItem('token') ?? '' : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Download CV
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {applicant.offerLetterSentAt && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Offer Sent</p>
                <p className="text-xs text-slate-600">
                  {new Date(applicant.offerLetterSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 shrink-0 px-2">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={cn('px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === t.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ── Overview ── */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name',   value: applicant.fullName },
                      { label: 'Applied For', value: applicant.positionTitle ?? '—' },
                      { label: 'Email',       value: applicant.email },
                      { label: 'Phone',       value: applicant.phone ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
                        <p className="text-sm text-slate-800 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                  {applicant.coverLetter && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Cover Letter</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{applicant.coverLetter}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Notes ── */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {applicant.interviewNotes ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">Notes</p>
                      <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{applicant.interviewNotes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">No notes yet</div>
                  )}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Add Note</p>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Add an internal note about this applicant…"
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!note.trim() || addingNote}
                      className="mt-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {addingNote ? 'Saving…' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Interview ── */}
              {activeTab === 'interview' && (
                <div className="space-y-5">
                  {sched ? (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarClock className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-semibold text-purple-800">Scheduled Interview</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-purple-500 mb-0.5">Date</p>
                          <p className="text-purple-800 font-medium">{sched.scheduledDate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-purple-500 mb-0.5">Time</p>
                          <p className="text-purple-800 font-medium">{sched.scheduledTime}</p>
                        </div>
                        {sched.location && (
                          <div className="col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-purple-500 mb-0.5">Location</p>
                            <p className="text-purple-800">{sched.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-sm">No interview scheduled yet</div>
                  )}

                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Schedule New Interview</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Date</label>
                        <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Time</label>
                        <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Location / Meeting Link</label>
                      <input type="text" value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)}
                        placeholder="Room 3B or https://meet.google.com/…" className={inp} />
                    </div>
                    <button
                      onClick={handleScheduleInterview}
                      disabled={!interviewDate || !interviewTime || schedulingInterview}
                      className="flex items-center gap-2 h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {schedulingInterview ? 'Scheduling…' : 'Schedule Interview'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Stage / Actions ── */}
              {activeTab === 'stage' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Move to Stage</p>
                    <div className="flex flex-wrap gap-2">
                      {STAGES.filter(s => s !== applicant.stage && s !== 'hired').map(s => {
                        const c = STAGE_CONFIG[s];
                        return (
                          <button key={s} onClick={() => onStageChange(s)}
                            className={cn('flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors hover:opacity-80', c.bgCls, c.textCls, c.borderCls)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', c.dotCls)} />
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-3">
                    <p className="text-sm font-semibold text-amber-900">Offer Details</p>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Offered Salary (KES)</label>
                      <CurrencyInput value={offeredSalary} onChange={setOfferedSalary} placeholder="e.g. 85,000" className="bg-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Expected Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="h-10 border border-amber-200 rounded-xl px-3 text-sm w-full focus:outline-none bg-white" />
                    </div>
                    <button
                      onClick={() => onSendOfferLetter({ offeredSalary: offeredSalary ? Number(offeredSalary) : undefined, startDate: startDate || undefined })}
                      className="flex items-center justify-center gap-2 w-full h-10 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Offer Letter (PDF)
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button onClick={onHire}
                      className="flex-1 flex items-center justify-center gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      <UserCheck className="h-4 w-4" />
                      Mark as Hired
                    </button>
                    {applicant.stage !== 'rejected' && (
                      <button onClick={onReject}
                        className="flex items-center justify-center gap-2 h-10 px-4 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors">
                        <UserX className="h-4 w-4" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
