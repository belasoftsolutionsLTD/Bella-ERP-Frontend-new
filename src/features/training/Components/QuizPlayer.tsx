'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuizForLearner, QuizAttemptResponse } from '../types';

export function QuizPlayer({ quiz, attemptsRemaining, onSubmit }: {
  quiz: QuizForLearner;
  attemptsRemaining: number;
  onSubmit: (answers: { questionId: string; answer: string | string[] }[]) => Promise<QuizAttemptResponse | null | undefined>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (qid: string, value: string) => setAnswers((a) => ({ ...a, [qid]: value }));

  const submit = async () => {
    setSubmitting(true);
    const payload = quiz.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }));
    const res = await onSubmit(payload);
    if (res) setResult(res);
    setSubmitting(false);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className={`rounded-lg p-4 border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-semibold ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
            {result.passed ? 'Quiz passed!' : 'Quiz not passed'} — Score: {result.score}%
          </p>
          {!result.passed && <p className="text-sm text-red-700 mt-1">{result.attemptsRemaining} attempt(s) remaining.</p>}
        </div>
        <div className="space-y-3">
          {result.results.map((r) => (
            <div key={r.questionId} className="flex items-start gap-2 text-sm">
              {r.correct ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
              <div>
                <p className="text-slate-700">Your answer: {Array.isArray(r.yourAnswer) ? r.yourAnswer.join(', ') : r.yourAnswer}</p>
                {!r.correct && r.correctAnswer && <p className="text-slate-500">Correct answer: {Array.isArray(r.correctAnswer) ? r.correctAnswer.join(', ') : r.correctAnswer}</p>}
                {r.explanation && <p className="text-slate-400 italic">{r.explanation}</p>}
              </div>
            </div>
          ))}
        </div>
        {!result.passed && result.attemptsRemaining > 0 && (
          <Button size="sm" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>Try Again</Button>
        )}
      </div>
    );
  }

  if (attemptsRemaining <= 0) {
    return <p className="text-sm text-red-600">No attempts remaining for this quiz.</p>;
  }

  return (
    <div className="space-y-5">
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium text-slate-800">{i + 1}. {q.text}</p>
          {q.type === 'trueFalse' ? (
            <div className="flex gap-3">
              {['true', 'false'].map((v) => (
                <label key={v} className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input type="radio" name={q.id} checked={answers[q.id] === v} onChange={() => setAnswer(q.id, v)} /> {v}
                </label>
              ))}
            </div>
          ) : q.type === 'multipleChoice' ? (
            <div className="space-y-1.5">
              {(q.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} /> {opt}
                </label>
              ))}
            </div>
          ) : (
            <input value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Your answer" />
          )}
        </div>
      ))}
      <Button className="bg-brand-primary text-white" onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Quiz'}</Button>
    </div>
  );
}
