'use client';

import { useState } from 'react';
import { Loader2, CalendarCheck, MapPin, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';
import { useMyInterviews } from '../Hooks/useMyInterviews';
import { SubmitScorecardModal } from '../Components/SubmitScorecardModal';
import type { MyInterview } from '../types';

const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });

export default function MyInterviewsPage() {
  const { interviews, isLoading, submitScorecard } = useMyInterviews();
  const [active, setActive] = useState<MyInterview | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">My Interviews</h1>
        <p className="text-sm text-brand-text-secondary">Candidates you've been assigned to interview, and their scorecards</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
        ) : interviews.length === 0 ? (
          <p className="text-sm text-brand-text-secondary text-center py-16">You have no interview assignments right now.</p>
        ) : (
          interviews.map((iv) => (
            <div key={`${iv.applicationId}-${iv.stageId}`} className="px-4 py-4 border-b border-slate-50 last:border-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{iv.candidateName}</p>
                  <p className="text-xs text-brand-text-secondary mt-0.5">{iv.jobTitle} · {iv.stageName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <CalendarCheck className="h-3.5 w-3.5" /> {fmtDateTime(iv.scheduledAt)}
                  </div>
                  {iv.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> {iv.location}
                    </div>
                  )}
                  {iv.meetingLink && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                      <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{iv.meetingLink}</a>
                    </div>
                  )}
                  {iv.requiredDocuments && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <FileText className="h-3.5 w-3.5" /> {iv.requiredDocuments}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {iv.scorecardSubmitted ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Scorecard submitted
                    </span>
                  ) : (
                    <button
                      onClick={() => setActive(iv)}
                      className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Submit Scorecard
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {active && (
        <SubmitScorecardModal
          interview={active}
          onClose={() => setActive(null)}
          onSubmit={submitScorecard}
        />
      )}
    </div>
  );
}
