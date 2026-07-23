'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Loader2, Users, Building2, ShieldCheck, Newspaper, Bell, Rocket, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnnouncements, type Announcement } from '../Hooks/useAnnouncements';
import { ChatPanel } from '@/features/staffPortal/Components/ChatPanel';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const EMPLOYMENT_TYPE_OPTS = [
  { value: 'permanent',  label: 'Permanent' },
  { value: 'contract',   label: 'Contract' },
  { value: 'part-time',  label: 'Part-time' },
  { value: 'intern',     label: 'Intern' },
] as const;

// ── Type options ──────────────────────────────────────────────────────────────
const TYPE_OPTS = [
  { value: 'news',     label: 'News',     icon: Newspaper,  color: 'text-blue-600',   bg: 'bg-blue-500/10 border-blue-500/30' },
  { value: 'alert',    label: 'Alert',    icon: Bell,       color: 'text-red-600',    bg: 'bg-red-500/10 border-red-500/30' },
  { value: 'campaign', label: 'Campaign', icon: Rocket,     color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/30' },
] as const;

// ── Audience options (multi-select) ───────────────────────────────────────────
const AUDIENCE_OPTS = [
  { value: 'all',            label: 'All Staff',      icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  { value: 'staff',          label: 'Staff Only',     icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { value: 'department_head',label: 'Dept Heads',     icon: Building2,   color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { value: 'hr_only',        label: 'HR Only',        icon: ShieldCheck, color: 'text-amber-600',  bg: 'bg-amber-500/10' },
] as const;

type CommType = 'news' | 'alert' | 'campaign';
type Tab = 'announcements' | 'messages';

export default function CommunicationsPage() {
  const { announcements, loading, creating, createAnnouncement, deleteAnnouncement } = useAnnouncements();

  const [tab, setTab]                   = useState<Tab>('announcements');
  const [showForm, setShowForm]         = useState(false);
  const [title, setTitle]               = useState('');
  const [body, setBody]                 = useState('');
  const [type, setType]                 = useState<CommType>('news');
  const [audiences, setAudiences]       = useState<string[]>(['all']);
  const [deptInput, setDeptInput]       = useState('');
  const [deptChips, setDeptChips]       = useState<string[]>([]);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // Job group / employee targeting — fetched once for the pickers below.
  const [jobGroups, setJobGroups]   = useState<{ _id: string; name: string }[]>([]);
  const [employees, setEmployees]   = useState<{ _id: string; fullName: string }[]>([]);
  const [jobGroupChips, setJobGroupChips]           = useState<{ id: string; name: string }[]>([]);
  const [employeeChips, setEmployeeChips]           = useState<{ id: string; name: string }[]>([]);
  const [employmentTypeChips, setEmploymentTypeChips] = useState<string[]>([]);
  const [jobGroupPick, setJobGroupPick]             = useState('');
  const [employeePick, setEmployeePick]             = useState('');

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/config/job-groups?limit=200`, showToast: false,
      thenFn: r => setJobGroups(r.data?.data ?? r.data ?? []) });
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees?limit=500`, showToast: false,
      thenFn: r => setEmployees(r.data?.data ?? r.data ?? []) });
  }, []);

  const reset = () => {
    setTitle(''); setBody(''); setType('news');
    setAudiences(['all']); setDeptInput(''); setDeptChips([]);
    setJobGroupChips([]); setEmployeeChips([]); setEmploymentTypeChips([]);
    setJobGroupPick(''); setEmployeePick('');
    setShowForm(false);
  };

  const addJobGroup = () => {
    if (!jobGroupPick || jobGroupChips.some(c => c.id === jobGroupPick)) return;
    const jg = jobGroups.find(j => j._id === jobGroupPick);
    if (!jg) return;
    setJobGroupChips(prev => [...prev, { id: jg._id, name: jg.name }]);
    setJobGroupPick('');
  };
  const removeJobGroup = (id: string) => setJobGroupChips(prev => prev.filter(c => c.id !== id));

  const addEmployee = () => {
    if (!employeePick || employeeChips.some(c => c.id === employeePick)) return;
    const e = employees.find(emp => emp._id === employeePick);
    if (!e) return;
    setEmployeeChips(prev => [...prev, { id: e._id, name: e.fullName }]);
    setEmployeePick('');
  };
  const removeEmployee = (id: string) => setEmployeeChips(prev => prev.filter(c => c.id !== id));

  const toggleEmploymentType = (val: string) => setEmploymentTypeChips(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const toggleAudience = (val: string) => {
    if (val === 'all') { setAudiences(['all']); return; }
    setAudiences(prev => {
      const next = prev.filter(a => a !== 'all');
      return next.includes(val) ? next.filter(a => a !== val) : [...next, val];
    });
  };

  const addDept = () => {
    const d = deptInput.trim();
    if (!d || deptChips.includes(d)) return;
    setDeptChips(prev => [...prev, d]);
    setDeptInput('');
    if (!audiences.includes('all')) {
      setAudiences(prev => [...prev.filter(a => !a.startsWith('department:')), `department:${d}`]);
    }
  };

  const removeDept = (d: string) => {
    setDeptChips(prev => prev.filter(c => c !== d));
    setAudiences(prev => prev.filter(a => a !== `department:${d}`));
  };

  const submit = async () => {
    if (!title.trim() || !body.trim() || audiences.length === 0) return;
    const finalAudiences = [
      ...audiences.filter(a => !a.startsWith('department:')),
      ...deptChips.map(d => `department:${d}`),
      ...jobGroupChips.map(jg => `jobGroup:${jg.id}`),
      ...employeeChips.map(e => `employee:${e.id}`),
      ...employmentTypeChips.map(et => `employmentType:${et}`),
    ];
    await createAnnouncement({ title: title.trim(), body: body.trim(), type, audiences: finalAudiences });
    reset();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteAnnouncement(id);
    setDeletingId(null);
  };

  const typeMeta = (t: string) => TYPE_OPTS.find(o => o.value === t) ?? TYPE_OPTS[0];

  const audienceSummary = (a: Announcement) => {
    const list = a.audiences ?? [a.audience];
    return list.map(v => {
      if (v === 'all') return 'All Staff';
      if (v === 'staff') return 'Staff';
      if (v === 'department_head') return 'Dept Heads';
      if (v === 'hr_only') return 'HR Only';
      if (v.startsWith('department:')) return v.replace('department:', '') + ' dept';
      if (v.startsWith('jobGroup:')) {
        const id = v.replace('jobGroup:', '');
        return (jobGroups.find(j => j._id === id)?.name ?? 'Job Group') + ' job group';
      }
      if (v.startsWith('employee:')) {
        const id = v.replace('employee:', '');
        return employees.find(e => e._id === id)?.fullName ?? 'an employee';
      }
      if (v.startsWith('employmentType:')) {
        const et = v.replace('employmentType:', '');
        return (EMPLOYMENT_TYPE_OPTS.find(o => o.value === et)?.label ?? et) + ' staff';
      }
      return v;
    }).join(', ');
  };

  return (
    <div className={cn('flex flex-col', tab === 'messages' ? 'h-[calc(100vh-80px)]' : 'p-6 space-y-6')}>
      {/* Header + Tabs */}
      <div className={cn('space-y-4', tab === 'messages' && 'px-6 pt-6')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-text">Communications</h1>
            <p className="text-sm text-brand-text-secondary mt-0.5">Broadcast announcements and chat with staff</p>
          </div>
          {tab === 'announcements' && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          )}
        </div>

        <div className="flex border-b border-brand-border gap-1">
          {([
            { key: 'announcements' as Tab, label: 'Announcements', icon: Megaphone },
            { key: 'messages'      as Tab, label: 'Messages',      icon: MessageSquare },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === key
                  ? 'border-brand-primary text-indigo-400'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text'
              )}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'messages' && (
        <div className="flex-1 min-h-0 mx-6 mb-6 rounded-2xl border border-brand-border/60 bg-brand-bg-soft overflow-hidden">
          <ChatPanel announcements={[]} onReadAnnouncement={() => {}} />
        </div>
      )}

      {tab === 'announcements' && (
        <>
        {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-5 space-y-4">
          <h2 className="font-bold text-brand-text flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-indigo-400" /> Write Announcement
          </h2>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Type</label>
            <div className="flex gap-2">
              {TYPE_OPTS.map(({ value, label, icon: Icon, color, bg }) => (
                <button key={value} onClick={() => setType(value as CommType)}
                  className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                    type === value ? `${bg} ${color} border-current` : 'bg-brand-bg-soft text-brand-text-secondary hover:bg-brand-bg-muted border-brand-border')}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Public Holiday Notice"
              className="w-full bg-brand-bg-soft border border-brand-border text-brand-text placeholder:text-brand-text-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder="Write your announcement here…"
              className="w-full bg-brand-bg-soft border border-brand-border text-brand-text placeholder:text-brand-text-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none" />
          </div>

          {/* Audiences */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Recipients (select multiple)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCE_OPTS.map(({ value, label, icon: Icon, color, bg }) => {
                const active = audiences.includes(value);
                return (
                  <button key={value} onClick={() => toggleAudience(value)}
                    className={cn('flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all',
                      active ? `${bg} ${color} border-current ring-1 ring-current/30` : 'bg-brand-bg-soft text-brand-text-secondary hover:bg-brand-bg-muted border-brand-border')}>
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific departments */}
          {!audiences.includes('all') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Add Specific Departments</label>
              <div className="flex gap-2">
                <input value={deptInput} onChange={e => setDeptInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDept()}
                  placeholder="e.g. Finance, then press Enter"
                  className="flex-1 bg-brand-bg-soft border border-brand-border text-brand-text placeholder:text-brand-text-muted rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                <button onClick={addDept} className="px-3 py-2 bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text rounded-xl text-sm transition-colors">Add</button>
              </div>
              {deptChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {deptChips.map(d => (
                    <span key={d} className="flex items-center gap-1 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/30 px-2 py-1 rounded-full">
                      {d}
                      <button onClick={() => removeDept(d)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specific job groups */}
          {!audiences.includes('all') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Add Specific Job Groups</label>
              <div className="flex gap-2">
                <select value={jobGroupPick} onChange={e => setJobGroupPick(e.target.value)}
                  className="flex-1 bg-brand-bg-soft border border-brand-border text-brand-text rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="">Select a job group…</option>
                  {jobGroups.map(jg => <option key={jg._id} value={jg._id}>{jg.name}</option>)}
                </select>
                <button onClick={addJobGroup} className="px-3 py-2 bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text rounded-xl text-sm transition-colors">Add</button>
              </div>
              {jobGroupChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {jobGroupChips.map(jg => (
                    <span key={jg.id} className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-1 rounded-full">
                      {jg.name}
                      <button onClick={() => removeJobGroup(jg.id)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specific employees */}
          {!audiences.includes('all') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Add Specific Employees</label>
              <div className="flex gap-2">
                <select value={employeePick} onChange={e => setEmployeePick(e.target.value)}
                  className="flex-1 bg-brand-bg-soft border border-brand-border text-brand-text rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="">Select an employee…</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                </select>
                <button onClick={addEmployee} className="px-3 py-2 bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text rounded-xl text-sm transition-colors">Add</button>
              </div>
              {employeeChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {employeeChips.map(e => (
                    <span key={e.id} className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 border border-blue-500/30 px-2 py-1 rounded-full">
                      {e.name}
                      <button onClick={() => removeEmployee(e.id)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specific employment types */}
          {!audiences.includes('all') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Add Specific Employment Types</label>
              <div className="flex gap-2 flex-wrap">
                {EMPLOYMENT_TYPE_OPTS.map(({ value, label }) => {
                  const active = employmentTypeChips.includes(value);
                  return (
                    <button key={value} onClick={() => toggleEmploymentType(value)}
                      className={cn('px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                        active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 ring-1 ring-emerald-500/30' : 'bg-brand-bg-soft text-brand-text-secondary hover:bg-brand-bg-muted border-brand-border')}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={submit} disabled={creating || !title.trim() || !body.trim() || audiences.length === 0}
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {creating ? 'Publishing…' : 'Publish'}
            </button>
            <button onClick={reset} className="text-sm text-brand-text-secondary hover:text-brand-text px-3 py-2 rounded-xl hover:bg-brand-bg-soft transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-primary/40" /></div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Megaphone className="h-12 w-12 text-brand-text-muted" />
          <p className="text-sm font-medium text-brand-text-muted">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
          </p>
          {announcements.map(a => {
            const meta = typeMeta(a.type ?? 'news');
            const Icon = meta.icon;
            return (
              <div key={a._id} className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-5 transition-colors hover:border-brand-border-strong">
                <div className="flex items-start gap-4">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border', meta.bg)}>
                    <Icon className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-brand-text">{a.title}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary border border-brand-border-strong">
                        {audienceSummary(a)}
                      </span>
                    </div>
                    <p className="text-sm text-brand-text-secondary mt-1.5 leading-relaxed">{a.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-brand-text-muted">
                      <span>By {a.createdByName}</span>
                      <span>·</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a._id)}
                    disabled={deletingId === a._id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    {deletingId === a._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
