'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserAccounts } from '../Hooks/useUserAccounts';
import { useCourses } from '../Hooks/useCourses';
import { useLearningPaths } from '../Hooks/useLearningPaths';
import { useEnrollments } from '../Hooks/useEnrollments';
import { useRules } from '../Hooks/useRules';

function AssignTab() {
  const { accounts } = useUserAccounts();
  const { courses } = useCourses({ status: 'published' });
  const { paths } = useLearningPaths('active');
  const { assignTraining } = useEnrollments();

  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState<{ type: 'course' | 'path'; id: string }>({ type: 'course', id: '' });
  const [dueDate, setDueDate] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const departments = [...new Set(accounts.map((a) => a.department).filter(Boolean))] as string[];
  const filteredAccounts = deptFilter ? accounts.filter((a) => a.department === deptFilter) : accounts;

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const selectAllFiltered = () => setSelected(filteredAccounts.map((a) => a._id));

  const submit = async () => {
    if (!selected.length || !target.id) return;
    await assignTraining({
      employeeIds: selected,
      courseId: target.type === 'course' ? target.id : undefined,
      learningPathId: target.type === 'path' ? target.id : undefined,
      dueDate: dueDate || undefined,
    });
    setSelected([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Select Employees ({selected.length})</h3>
          <div className="flex gap-2">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={selectAllFiltered} className="text-xs text-primary hover:underline">Select all</button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {filteredAccounts.map((a) => (
            <label key={a._id} className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={selected.includes(a._id)} onChange={() => toggle(a._id)} />
              {a.name} <span className="text-xs text-slate-400">({a.department || 'no dept'})</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Assign</h3>
        <div className="flex gap-2">
          <select value={target.type} onChange={(e) => setTarget({ type: e.target.value as 'course' | 'path', id: '' })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="course">Course</option>
            <option value="path">Learning Path</option>
          </select>
          <select value={target.id} onChange={(e) => setTarget((t) => ({ ...t, id: e.target.value }))} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select {target.type}...</option>
            {(target.type === 'course' ? courses : paths).map((item: any) => <option key={item._id} value={item._id}>{item.title || item.name}</option>)}
          </select>
        </div>
        <label className="block text-xs text-slate-500">Due date (optional)
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <Button className="bg-primary text-white w-full" disabled={!selected.length || !target.id} onClick={submit}>
          Assign to {selected.length} employee{selected.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}

function RulesTab() {
  const { rules, createRule, updateRule, runRuleNow } = useRules();
  const { courses } = useCourses({ status: 'published' });
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', trigger: 'onHire' as const, enrollInCourseIds: [] as string[], dueDateOffsetDays: 7, notifyEmployee: true, notifyManager: false,
  });

  const submit = async () => {
    const result = await createRule({
      name: form.name,
      trigger: form.trigger,
      triggerConditions: {},
      action: { enrollInCourseIds: form.enrollInCourseIds, enrollInLearningPathIds: [], dueDateOffsetDays: form.dueDateOffsetDays, notifyEmployee: form.notifyEmployee, notifyManager: form.notifyManager },
      isActive: true,
    });
    if (result) setShowNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-primary text-white" onClick={() => setShowNew((s) => !s)}><Plus className="h-4 w-4 mr-1" /> New Rule</Button>
      </div>
      {showNew && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <input placeholder="Rule name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as any }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="onHire">On Hire</option>
            <option value="onRoleChange">On Role Change</option>
            <option value="onDepartmentChange">On Department Change</option>
            <option value="onPerformanceScore">On Performance Score</option>
            <option value="onCertExpiry">On Certificate Expiry</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <select multiple value={form.enrollInCourseIds} onChange={(e) => setForm((f) => ({ ...f, enrollInCourseIds: Array.from(e.target.selectedOptions).map((o) => o.value) }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-24">
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <input type="number" placeholder="Due in (days)" value={form.dueDateOffsetDays} onChange={(e) => setForm((f) => ({ ...f, dueDateOffsetDays: Number(e.target.value) }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.notifyEmployee} onChange={(e) => setForm((f) => ({ ...f, notifyEmployee: e.target.checked }))} /> Notify employee</label>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.notifyManager} onChange={(e) => setForm((f) => ({ ...f, notifyManager: e.target.checked }))} /> Notify manager</label>
          </div>
          <Button size="sm" className="bg-primary text-white" onClick={submit} disabled={!form.name || !form.enrollInCourseIds.length}>Create Rule</Button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {rules.map((r) => (
          <div key={r._id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">{r.name}</p>
              <p className="text-xs text-slate-500">{r.trigger} · last run: {r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString() : 'never'} ({r.lastRunCreated ?? 0} created)</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={r.isActive} onChange={(e) => updateRule(r._id, { isActive: e.target.checked })} /> Active
              </label>
              <button onClick={() => runRuleNow(r._id)} className="text-xs text-primary hover:underline">Run Now</button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No rules yet.</p>}
      </div>
    </div>
  );
}

function QueueTab() {
  const { rules } = useRules();
  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {rules.filter((r) => r.isActive).map((r) => (
        <div key={r._id} className="p-3 flex items-center justify-between text-sm">
          <span className="text-slate-700">{r.name} <span className="text-xs text-slate-400">({r.trigger})</span></span>
          <span className="text-xs text-slate-500">Last run matched {r.lastRunMatched ?? 0}, created {r.lastRunCreated ?? 0}</span>
        </div>
      ))}
      {rules.filter((r) => r.isActive).length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No active rules queued.</p>}
    </div>
  );
}

export function AssignmentCenterPage() {
  const [tab, setTab] = useState<'assign' | 'rules' | 'queue'>('assign');
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Assignment Center</h1>
        <p className="text-sm text-slate-400">Assign training and manage automation rules</p>
      </div>
      <div className="flex gap-1 border-b border-slate-800">
        {(['assign', 'rules', 'queue'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-slate-400'}`}>{t}</button>
        ))}
      </div>
      {tab === 'assign' && <AssignTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'queue' && <QueueTab />}
    </div>
  );
}
