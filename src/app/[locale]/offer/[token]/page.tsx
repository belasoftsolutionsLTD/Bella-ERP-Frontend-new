'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Briefcase, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface Offer {
  candidateName: string;
  jobTitle: string;
  department: string;
  salary: number;
  currency: string;
  startDate: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

type View = 'loading' | 'ready' | 'confirm' | 'done' | 'error';

export default function OfferResponsePage() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [view, setView] = useState<View>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'declined' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/public/offers/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setErrorMsg(d.message || 'This offer link is invalid or has expired.'); setView('error'); return; }
        setOffer(d.data);
        setView(d.data.status === 'pending' ? 'ready' : 'done');
      })
      .catch(() => { setErrorMsg('Something went wrong loading your offer.'); setView('error'); });
  }, [token]);

  const respond = (status: 'accepted' | 'declined') => {
    setSubmitting(true);
    fetch(`${API_BASE}/public/offers/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setErrorMsg(d.message || 'Failed to submit your response.'); setView('error'); return; }
        setOffer((o) => (o ? { ...o, status } : o));
        setView('done');
      })
      .catch(() => { setErrorMsg('Something went wrong submitting your response.'); setView('error'); })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-brand-bg-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {view === 'loading' && (
          <p className="text-center text-brand-text-secondary text-sm">Loading your offer…</p>
        )}

        {view === 'error' && (
          <div className="text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-brand-danger mx-auto" />
            <p className="text-brand-text font-semibold">{errorMsg}</p>
            <p className="text-xs text-brand-text-muted">Please contact HR if you believe this is a mistake.</p>
          </div>
        )}

        {offer && (view === 'ready' || view === 'confirm') && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-brand-text">Offer of Employment</h1>
              <p className="text-sm text-brand-text-secondary mt-1">Dear {offer.candidateName}, please review your offer below.</p>
            </div>
            <div className="space-y-3 bg-brand-bg-soft rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-brand-primary shrink-0" />
                <span className="text-brand-text">{offer.jobTitle}{offer.department ? ` · ${offer.department}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-brand-primary shrink-0" />
                <span className="text-brand-text">{offer.currency} {offer.salary.toLocaleString()} / month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-brand-primary shrink-0" />
                <span className="text-brand-text">Start date: {new Date(offer.startDate).toLocaleDateString('en-KE', { dateStyle: 'long' })}</span>
              </div>
              <p className="text-xs text-brand-text-muted">This offer expires on {new Date(offer.expiresAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}.</p>
            </div>

            {view === 'ready' && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setDecision('declined'); setView('confirm'); }}
                  className="flex-1 h-11 rounded-xl border border-brand-border text-brand-text-secondary font-semibold text-sm hover:bg-brand-bg-muted transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => { setDecision('accepted'); setView('confirm'); }}
                  className="flex-1 h-11 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-hover transition-colors"
                >
                  Accept Offer
                </button>
              </div>
            )}

            {view === 'confirm' && decision && (
              <div className="space-y-3 border-t border-brand-border pt-4">
                <p className="text-sm text-brand-text text-center">
                  Are you sure you want to <strong>{decision === 'accepted' ? 'accept' : 'decline'}</strong> this offer? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setView('ready')}
                    disabled={submitting}
                    className="flex-1 h-11 rounded-xl border border-brand-border text-brand-text-secondary font-semibold text-sm hover:bg-brand-bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => respond(decision)}
                    disabled={submitting}
                    className={`flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 ${
                      decision === 'accepted' ? 'bg-brand-primary hover:bg-brand-primary-hover' : 'bg-brand-danger hover:bg-brand-danger/90'
                    }`}
                  >
                    {submitting ? 'Submitting…' : `Confirm ${decision === 'accepted' ? 'Acceptance' : 'Decline'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {offer && view === 'done' && (
          <div className="text-center space-y-3">
            {offer.status === 'accepted' ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-status-success-text mx-auto" />
                <p className="text-brand-text font-semibold">You've accepted this offer.</p>
                <p className="text-sm text-brand-text-secondary">Welcome aboard! HR will be in touch with your onboarding details shortly.</p>
              </>
            ) : (
              <>
                <XCircle className="h-10 w-10 text-brand-text-muted mx-auto" />
                <p className="text-brand-text font-semibold">You've declined this offer.</p>
                <p className="text-sm text-brand-text-secondary">Thank you for letting us know — we wish you the best.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
