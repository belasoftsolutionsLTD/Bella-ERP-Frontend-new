'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CourseModule, ModuleType, QuizQuestion } from '../types';
import { MODULE_TYPE_OPTIONS, uid } from '../constants';

function ContentFields({ type, content, onChange }: { type: ModuleType; content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...content, [k]: v });

  if (type === 'video') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Video URL" value={content.url || ''} onChange={(e) => set('url', e.target.value)} className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" placeholder="Duration (minutes)" value={content.durationMinutes || ''} onChange={(e) => set('durationMinutes', Number(e.target.value))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
    );
  }
  if (type === 'document') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="File URL" value={content.fileUrl || ''} onChange={(e) => set('fileUrl', e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input placeholder="File name" value={content.fileName || ''} onChange={(e) => set('fileName', e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
    );
  }
  if (type === 'text') {
    return <textarea placeholder="Markdown content" value={content.markdown || ''} onChange={(e) => set('markdown', e.target.value)} rows={6} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" />;
  }
  if (type === 'link') {
    return (
      <div className="space-y-2">
        <input placeholder="Link URL" value={content.linkUrl || ''} onChange={(e) => set('linkUrl', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input placeholder="Description" value={content.linkDescription || ''} onChange={(e) => set('linkDescription', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
    );
  }
  if (type === 'scorm') {
    return <input placeholder="SCORM package URL" value={content.packageUrl || ''} onChange={(e) => set('packageUrl', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />;
  }
  return <p className="text-xs text-slate-400">Configure the quiz below after saving this module.</p>;
}

export function AddModuleForm({ onAdd }: { onAdd: (payload: { title: string; type: ModuleType; isRequired: boolean; content: Record<string, any> }) => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModuleType>('text');
  const [isRequired, setIsRequired] = useState(true);
  const [content, setContent] = useState<Record<string, any>>({});

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), type, isRequired, content });
    setTitle(''); setContent({});
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Module title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => { setType(e.target.value as ModuleType); setContent({}); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {MODULE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <ContentFields type={type} content={content} onChange={setContent} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> Required
        </label>
        <Button size="sm" className="bg-primary text-white" onClick={submit} disabled={!title.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add Module
        </Button>
      </div>
    </div>
  );
}

export function QuizBuilder({ initial, onSave }: {
  initial?: { questions: QuizQuestion[]; passingScore: number; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean; timeLimitMinutes?: number };
  onSave: (payload: { questions: QuizQuestion[]; passingScore: number; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean; timeLimitMinutes?: number }) => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial?.questions || []);
  const [passingScore, setPassingScore] = useState(initial?.passingScore ?? 70);
  const [maxAttempts, setMaxAttempts] = useState(initial?.maxAttempts ?? 3);
  const [shuffleQuestions, setShuffleQuestions] = useState(initial?.shuffleQuestions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(initial?.shuffleOptions ?? false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>(initial?.timeLimitMinutes ?? '');

  const addQuestion = () => setQuestions((q) => [...q, { id: uid(), text: '', type: 'multipleChoice', options: ['', ''], correctAnswer: '', explanation: '', points: 1 }]);
  const updateQuestion = (i: number, patch: Partial<QuizQuestion>) => setQuestions((qs) => qs.map((q, qi) => qi === i ? { ...q, ...patch } : q));
  const removeQuestion = (i: number) => setQuestions((qs) => qs.filter((_, qi) => qi !== i));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <h4 className="font-medium text-slate-800">Quiz Configuration</h4>
      {questions.map((q, i) => (
        <div key={q.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input placeholder="Question text" value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value as QuizQuestion['type'] })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="multipleChoice">Multiple Choice</option>
                  <option value="trueFalse">True / False</option>
                  <option value="shortAnswer">Short Answer</option>
                </select>
                <input type="number" placeholder="Points" value={q.points} onChange={(e) => updateQuestion(i, { points: Number(e.target.value) })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              {q.type === 'multipleChoice' && (
                <div className="space-y-1">
                  {(q.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input value={opt} onChange={(e) => updateQuestion(i, { options: (q.options || []).map((o, x) => x === oi ? e.target.value : o) })} placeholder={`Option ${oi + 1}`} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <button type="button" onClick={() => updateQuestion(i, { options: (q.options || []).filter((_, x) => x !== oi) })} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateQuestion(i, { options: [...(q.options || []), ''] })} className="text-xs text-primary">+ Add option</button>
                  <input placeholder="Correct answer (exact option text)" value={String(q.correctAnswer)} onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mt-1" />
                </div>
              )}
              {q.type === 'trueFalse' && (
                <select value={String(q.correctAnswer)} onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}
              {q.type === 'shortAnswer' && (
                <input placeholder="Correct answer" value={String(q.correctAnswer)} onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              )}
              <input placeholder="Explanation (shown after submitting)" value={q.explanation || ''} onChange={(e) => updateQuestion(i, { explanation: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="button" onClick={() => removeQuestion(i)} className="text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Add Question</Button>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <label className="text-xs text-slate-500">Passing Score (%)
          <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-slate-500">Max Attempts
          <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-slate-500">Time Limit (minutes, optional)
          <input type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : '')} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex flex-col gap-1 justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} /> Shuffle questions</label>
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} /> Shuffle options</label>
        </div>
      </div>
      <Button
        size="sm" className="bg-primary text-white w-full"
        disabled={questions.length === 0}
        onClick={() => onSave({ questions, passingScore, maxAttempts, shuffleQuestions, shuffleOptions, timeLimitMinutes: timeLimitMinutes || undefined })}
      >
        Save Quiz
      </Button>
    </div>
  );
}
