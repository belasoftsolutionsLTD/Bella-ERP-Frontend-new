'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReview } from '../Hooks/useReview';
import { useTemplates } from '../Hooks/useTemplates';
import type { MyReviewTask, ReviewResponse } from '../constants';

interface Props {
  task: MyReviewTask;
  onClose: () => void;
  onSubmitted: () => void;
}

function RatingInput({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
          <Star className={cn('h-5 w-5 transition-colors', n <= value ? 'fill-amber-400 text-amber-400' : 'text-brand-text-muted')} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ task, onClose, onSubmitted }: Props) {
  // task.reviewId is null until a first draft has been saved (the task list surfaces work
  // before any review doc exists) — track the id locally so a successful first save can
  // switch useReview onto the newly-created doc and pick up its template/attendance context,
  // instead of staying permanently pointed at a null id for the rest of this modal's life.
  const [activeReviewId, setActiveReviewId] = useState(task.reviewId);
  const { review, loading, save, submit } = useReview(activeReviewId);
  const { templates } = useTemplates();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [overallRating, setOverallRating] = useState<number>(0);
  const [recommendation, setRecommendation] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!review) return;
    const map: Record<string, string | number> = {};
    (review.responses || []).forEach((r) => { map[r.questionId] = r.value; });
    setAnswers(map);
    setOverallRating(review.overallRating || 0);
    setRecommendation(review.recommendation || '');
  }, [review]);

  // Before any review doc exists, review?.template is unavailable (there's nothing to fetch
  // yet) — fall back to the templates list keyed by the task's own templateId, which the
  // task list endpoint already provides independently of a review existing.
  const template = review?.template ?? templates.find((t) => t._id === task.templateId) ?? null;
  const alreadySubmitted = review?.status === 'submitted';

  const buildResponses = (): ReviewResponse[] => {
    if (!template) return [];
    const out: ReviewResponse[] = [];
    template.sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (answers[q.id] !== undefined && answers[q.id] !== '') {
          out.push({ sectionId: section.id, questionId: q.id, value: answers[q.id] });
        }
      });
    });
    return out;
  };

  const handleSaveDraft = () => {
    setSaving(true);
    save(
      { cycleId: task.cycleId, employeeId: task.employeeId, reviewType: task.reviewType, responses: buildResponses(), overallRating: overallRating || undefined },
      (id) => { setActiveReviewId(id); setSaving(false); },
      () => setSaving(false),
    );
  };

  const handleSubmit = () => {
    setSubmitting(true);
    save(
      { cycleId: task.cycleId, employeeId: task.employeeId, reviewType: task.reviewType, responses: buildResponses(), overallRating: overallRating || undefined },
      (id) => {
        setActiveReviewId(id);
        submit(id, { overallRating: overallRating || undefined, recommendation: recommendation || undefined }, () => {
          setSubmitting(false);
          onSubmitted();
        }, () => setSubmitting(false));
      },
      () => setSubmitting(false),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">
              {task.reviewType === 'self' ? 'Self Review'
                : task.reviewType === 'peer' ? `Peer Review — ${task.employee?.fullName ?? 'Employee'}`
                : `Manager Review — ${task.employee?.fullName ?? 'Employee'}`}
            </h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">{task.cycleName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {task.reviewType === 'manager' && review?.attendanceSummary && (
            <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
                Attendance — last {review.attendanceSummary.periodDays} days
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-brand-text">{review.attendanceSummary.present}</p>
                  <p className="text-[11px] text-brand-text-muted">Present</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{review.attendanceSummary.late}</p>
                  <p className="text-[11px] text-brand-text-muted">Late</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{review.attendanceSummary.absent}</p>
                  <p className="text-[11px] text-brand-text-muted">Absent</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-text">{review.attendanceSummary.attendanceRate != null ? `${review.attendanceSummary.attendanceRate}%` : '—'}</p>
                  <p className="text-[11px] text-brand-text-muted">Rate</p>
                </div>
              </div>
            </div>
          )}
          {loading && activeReviewId ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
          ) : !template ? (
            <p className="text-sm text-brand-text-secondary text-center py-10">
              No review template is attached to this cycle. Ask HR to attach one, or contact them for guidance on what to write.
            </p>
          ) : (
            <>
              {template.sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h3 className="text-sm font-bold text-brand-text">{section.title}</h3>
                  {section.questions.map((q) => (
                    <div key={q.id} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
                      <p className="text-sm text-brand-text-secondary mb-2">{q.text}</p>
                      {q.type === 'rating' ? (
                        <RatingInput
                          value={Number(answers[q.id]) || 0}
                          max={q.scaleMax || 5}
                          onChange={(v) => !alreadySubmitted && setAnswers((a) => ({ ...a, [q.id]: v }))}
                        />
                      ) : (
                        <textarea
                          value={String(answers[q.id] ?? '')}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                          disabled={alreadySubmitted}
                          rows={3}
                          className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary disabled:opacity-60"
                          placeholder="Write your response..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
                <p className="text-sm font-semibold text-brand-text mb-2">Overall Rating</p>
                <RatingInput value={overallRating} max={5} onChange={(v) => !alreadySubmitted && setOverallRating(v)} />
              </div>

              {task.reviewType === 'manager' && (
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Recommendation</label>
                  <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} disabled={alreadySubmitted}
                    className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary disabled:opacity-60">
                    <option value="">No recommendation</option>
                    <option value="promote">Recommend for Promotion</option>
                    <option value="pip">Recommend Performance Improvement Plan</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {template && !alreadySubmitted && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
            <button type="button" onClick={handleSaveDraft} disabled={saving || submitting}
              className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || submitting}
              className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
        {alreadySubmitted && (
          <div className="px-6 py-4 border-t border-brand-border shrink-0">
            <p className="text-xs text-emerald-400 font-medium">Submitted {review?.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : ''}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
