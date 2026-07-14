'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, PowerOff, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConceptCategory = 'earnings' | 'deductions' | 'benefits' | 'employer_contributions';
type ConceptType     = 'fixed' | 'variable' | 'percentage' | 'formula';

interface PayrollConcept {
  _id: string;
  name: string;
  code: string;
  category: ConceptCategory;
  subCategory: string;
  type: ConceptType;
  defaultAmount?: number;
  currency: string;
  percentageOf?: string;
  percentageValue?: number;
  formula?: string;
  isActive: boolean;
  isTaxable: boolean;
  isRecurring: boolean;
  appearsOnPayslip: boolean;
  alertIfUndefined: boolean;
  employeeCount?: number;
  createdAt: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<ConceptCategory, { label: string; color: string; bg: string; text: string; border: string }> = {
  earnings:               { label: 'Earnings',             color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-l-emerald-500'   },
  deductions:             { label: 'Deductions',           color: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-l-red-500'       },
  benefits:               { label: 'Benefits',             color: '#3b82f6', bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-l-blue-500'      },
  employer_contributions: { label: 'Employer Contrib.',    color: '#8b5cf6', bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-l-violet-500'    },
};

const TYPE_CFG: Record<ConceptType, { label: string; bg: string; text: string }> = {
  fixed:      { label: 'Fixed',      bg: 'bg-brand-bg-muted',      text: 'text-brand-text-secondary'  },
  variable:   { label: 'Variable',   bg: 'bg-amber-500/15',   text: 'text-amber-400'  },
  percentage: { label: 'Percentage', bg: 'bg-brand-primary/15',  text: 'text-indigo-400' },
  formula:    { label: 'Formula',    bg: 'bg-cyan-500/15',    text: 'text-cyan-400'   },
};

const TABS: { key: ConceptCategory | 'all'; label: string }[] = [
  { key: 'all',                   label: 'All'                 },
  { key: 'earnings',              label: 'Earnings'            },
  { key: 'deductions',            label: 'Deductions'          },
  { key: 'benefits',              label: 'Benefits'            },
  { key: 'employer_contributions',label: 'Employer Contrib.'   },
];

const SUB_CATEGORY_OPTIONS: Record<ConceptCategory, { value: string; label: string }[]> = {
  earnings: [
    { value: 'fixed_pay',       label: 'Fixed Pay'        },
    { value: 'variable_pay',    label: 'Variable Pay'     },
    { value: 'benefits_in_kind',label: 'Benefits in Kind' },
    { value: 'bonus',           label: 'Bonus'            },
  ],
  deductions: [
    { value: 'tax',               label: 'Tax'               },
    { value: 'social_security',   label: 'Social Security'   },
    { value: 'other_withholding', label: 'Other Withholding' },
  ],
  benefits: [
    { value: 'meals_transport', label: 'Meals & Transport' },
    { value: 'health',          label: 'Health Insurance'  },
    { value: 'childcare',       label: 'Childcare'         },
    { value: 'training',        label: 'Training'          },
    { value: 'wellness',        label: 'Wellness'          },
  ],
  employer_contributions: [
    { value: 'employer_contribution', label: 'Employer Contribution' },
  ],
};

const PERCENTAGE_OF_OPTIONS = [
  { value: 'gross_salary',  label: 'Gross Salary'  },
  { value: 'basic_salary',  label: 'Basic Salary'  },
  { value: 'custom',        label: 'Custom Formula' },
];

// ── Value display helper ──────────────────────────────────────────────────────

function formatConceptValue(c: PayrollConcept): string {
  if (c.type === 'fixed')      return c.defaultAmount != null ? `${c.currency} ${c.defaultAmount.toLocaleString()}/mo` : '—';
  if (c.type === 'percentage') return `${c.percentageValue ?? 0}% of ${c.percentageOf?.replace('_', ' ') ?? 'gross'}`;
  if (c.type === 'formula')    return c.formula ? `= ${c.formula}` : '—';
  return 'Variable';
}

// ── Toggle chip ───────────────────────────────────────────────────────────────

function Chip({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
      active ? 'bg-brand-primary/15 text-indigo-400' : 'bg-brand-bg-muted/60 text-brand-text-muted',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-indigo-400' : 'bg-slate-600')} />
      {label}
    </span>
  );
}

// ── Concept Card ──────────────────────────────────────────────────────────────

function ConceptCard({
  concept, onEdit, onToggle,
}: { concept: PayrollConcept; onEdit: (c: PayrollConcept) => void; onToggle: (c: PayrollConcept) => void }) {
  const cat  = CATEGORY_CFG[concept.category];
  const type = TYPE_CFG[concept.type];

  return (
    <div className={cn(
      'bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 flex flex-col gap-3',
      'border-l-4', cat.border,
      !concept.isActive && 'opacity-50',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-text truncate leading-tight">{concept.name}</p>
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-bg-soft text-brand-text-secondary border border-brand-border">
            {concept.code}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(concept)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-indigo-400 hover:bg-brand-primary-hover/10 transition-colors" title="Edit">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onToggle(concept)}
            className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
              concept.isActive
                ? 'text-brand-text-muted hover:text-red-400 hover:bg-red-500/10'
                : 'text-brand-text-muted hover:text-emerald-400 hover:bg-emerald-500/10')}
            title={concept.isActive ? 'Deactivate' : 'Activate'}>
            <PowerOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cat.bg, cat.text)}>
          {cat.label}
        </span>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', type.bg, type.text)}>
          {type.label}
        </span>
      </div>

      {/* Value */}
      <p className="text-sm font-semibold text-brand-text">{formatConceptValue(concept)}</p>

      {/* Toggles */}
      <div className="flex flex-wrap gap-1.5">
        <Chip active={concept.isRecurring}      label="Recurring"   />
        <Chip active={concept.isTaxable}        label="Taxable"     />
        <Chip active={concept.appearsOnPayslip} label="On Payslip"  />
      </div>

      {/* Footer */}
      <p className="text-[11px] text-brand-text-muted mt-auto">
        {concept.employeeCount ?? 0} employee{concept.employeeCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── Concept Drawer (centered modal) ──────────────────────────────────────────

interface DrawerProps {
  concept?: PayrollConcept | null;
  onClose: () => void;
  onSaved: () => void;
}

function codeFromName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function ConceptDrawer({ concept, onClose, onSaved }: DrawerProps) {
  const isEdit = Boolean(concept);
  const [saving, setSaving] = useState(false);

  const [name,             setName]             = useState(concept?.name             ?? '');
  const [code,             setCode]             = useState(concept?.code             ?? '');
  const [category,         setCategory]         = useState<ConceptCategory>(concept?.category ?? 'earnings');
  const [subCategory,      setSubCategory]      = useState(concept?.subCategory      ?? '');
  const [type,             setType]             = useState<ConceptType>(concept?.type ?? 'fixed');
  const [defaultAmount,    setDefaultAmount]    = useState(concept?.defaultAmount?.toString() ?? '');
  const [currency,         setCurrency]         = useState(concept?.currency         ?? 'KES');
  const [percentageOf,     setPercentageOf]     = useState(concept?.percentageOf     ?? 'gross_salary');
  const [percentageValue,  setPercentageValue]  = useState(concept?.percentageValue?.toString() ?? '');
  const [formula,          setFormula]          = useState(concept?.formula          ?? '');
  const [isTaxable,        setIsTaxable]        = useState(concept?.isTaxable        ?? false);
  const [isRecurring,      setIsRecurring]      = useState(concept?.isRecurring      ?? true);
  const [appearsOnPayslip, setAppearsOnPayslip] = useState(concept?.appearsOnPayslip ?? true);
  const [alertIfUndefined, setAlertIfUndefined] = useState(concept?.alertIfUndefined ?? false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(isEdit);

  // Auto-generate code from name (only when not manually edited)
  useEffect(() => {
    if (!codeManuallyEdited && name) setCode(codeFromName(name));
  }, [name, codeManuallyEdited]);

  // Reset sub-category when category changes
  useEffect(() => {
    if (!isEdit) setSubCategory(SUB_CATEGORY_OPTIONS[category]?.[0]?.value ?? '');
  }, [category, isEdit]);

  const handleSubmit = () => {
    if (!name.trim() || !code.trim() || !subCategory) return;
    setSaving(true);

    const body: Record<string, unknown> = {
      name, code, category, subCategory, type,
      currency, isTaxable, isRecurring, appearsOnPayslip, alertIfUndefined,
    };

    if (type === 'fixed')      body.defaultAmount   = Number(defaultAmount)   || 0;
    if (type === 'percentage') { body.percentageOf  = percentageOf; body.percentageValue = Number(percentageValue) || 0; }
    if (type === 'formula')    body.formula = formula;

    apiCallFunction({
      url:    isEdit ? `${API_BASE_URL}/payroll/concepts/${concept!._id}` : `${API_BASE_URL}/payroll/concepts`,
      method: isEdit ? 'PUT' : 'POST',
      data:   body,
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">{isEdit ? 'Edit Concept' : 'Add Payroll Concept'}</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Define a payroll building block</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
                Concept Name <span className="text-red-400">*</span>
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Basic Salary"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
                Code <span className="text-red-400">*</span>
              </label>
              <input value={code} onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')); setCodeManuallyEdited(true); }}
                placeholder="BASIC_SALARY"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm font-mono text-indigo-300 placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          </div>

          {/* Category selector */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_CFG) as [ConceptCategory, typeof CATEGORY_CFG[ConceptCategory]][]).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setCategory(key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                    category === key ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg-soft hover:border-brand-border-strong',
                  )}>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className={cn('text-xs font-semibold', category === key ? 'text-indigo-300' : 'text-brand-text-secondary')}>
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sub-category */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Sub-Category <span className="text-red-400">*</span>
            </label>
            <select value={subCategory} onChange={e => setSubCategory(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="">Select sub-category</option>
              {SUB_CATEGORY_OPTIONS[category].map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['fixed', 'variable', 'percentage', 'formula'] as ConceptType[]).map(t => {
                const cfg = TYPE_CFG[t];
                return (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={cn(
                      'py-2 rounded-xl border text-xs font-semibold transition-all',
                      type === t ? 'border-brand-primary bg-brand-primary/10 text-indigo-300' : 'border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:border-brand-border-strong',
                    )}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional value input */}
          {type === 'fixed' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Amount</label>
                <input type="number" value={defaultAmount} onChange={e => setDefaultAmount(e.target.value)} min={0}
                  placeholder="0"
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  <option>KES</option><option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
          )}

          {type === 'percentage' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Percentage (%)</label>
                <input type="number" value={percentageValue} onChange={e => setPercentageValue(e.target.value)} min={0} max={100} step={0.01}
                  placeholder="e.g. 6"
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Percentage of</label>
                <select value={percentageOf} onChange={e => setPercentageOf(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  {PERCENTAGE_OF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {type === 'formula' && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Formula</label>
              <input value={formula} onChange={e => setFormula(e.target.value)}
                placeholder="e.g. basic_salary * 0.05 + 500"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm font-mono text-cyan-300 placeholder:text-brand-text-muted focus:outline-none focus:border-cyan-500" />
              <p className="mt-1 text-[11px] text-brand-text-muted">Variables: basic_salary, gross_salary, hours_worked</p>
            </div>
          )}

          {type === 'variable' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-300">Variable concepts have no fixed default. The amount is entered per payroll cycle.</p>
            </div>
          )}

          {/* Toggle switches */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">Options</p>
            {[
              { label: 'Recurring',                    desc: 'Applies automatically every pay cycle', val: isRecurring,      set: setIsRecurring      },
              { label: 'Taxable',                      desc: 'Counts toward taxable income (PAYE)',  val: isTaxable,        set: setIsTaxable        },
              { label: 'Appears on payslip',           desc: 'Visible to employee on payslip',       val: appearsOnPayslip, set: setAppearsOnPayslip },
              { label: 'Alert if undefined',           desc: 'Warn HR if not set for an employee',   val: alertIfUndefined, set: setAlertIfUndefined },
            ].map(({ label, desc, val, set }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">{label}</p>
                  <p className="text-[11px] text-brand-text-muted">{desc}</p>
                </div>
                <button type="button" onClick={() => set(v => !v)}
                  className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', val ? 'bg-brand-primary' : 'bg-brand-bg-muted')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', val ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !name.trim() || !code.trim() || !subCategory}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Add Concept')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PayrollConceptsPage() {
  const [concepts,    setConcepts]    = useState<PayrollConcept[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<ConceptCategory | 'all'>('all');
  const [search,      setSearch]      = useState('');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<PayrollConcept | null>(null);

  const fetchConcepts = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/payroll/concepts?limit=200`,
      showToast: false,
      thenFn: r => setConcepts(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchConcepts(); }, [fetchConcepts]);

  const toggleActive = (concept: PayrollConcept) => {
    apiCallFunction({
      url:    `${API_BASE_URL}/payroll/concepts/${concept._id}`,
      method: 'PUT',
      data:   { isActive: !concept.isActive },
      thenFn: () => fetchConcepts(),
    });
  };

  const filtered = concepts.filter(c => {
    if (activeTab !== 'all' && c.category !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category for "All" tab section headers
  const grouped = TABS.slice(1).reduce<Record<string, PayrollConcept[]>>((acc, t) => {
    acc[t.key] = filtered.filter(c => c.category === t.key);
    return acc;
  }, {});

  const openAdd  = ()                        => { setEditTarget(null); setDrawerOpen(true); };
  const openEdit = (c: PayrollConcept)       => { setEditTarget(c);   setDrawerOpen(true); };
  const closeDrawer = ()                     => { setDrawerOpen(false); setEditTarget(null); };

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-brand-text tracking-tight">Payroll Concepts</h1>
              <p className="text-xs text-brand-text-secondary mt-0.5">Define the building blocks of payroll — earnings, deductions, benefits</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchConcepts} className="h-9 w-9 rounded-lg border border-brand-border bg-brand-bg-soft flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </button>
              <button onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-900/40">
                <Plus className="h-4 w-4" /> Add Concept
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all border-b-2',
                  activeTab === key
                    ? 'text-indigo-300 border-brand-primary bg-white/60'
                    : 'text-brand-text-muted border-transparent hover:text-brand-text-secondary hover:bg-brand-bg-soft/40',
                )}>
                {label}
                {key !== 'all' && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    activeTab === key ? 'bg-brand-primary/20 text-indigo-300' : 'bg-brand-bg-muted text-brand-text-muted')}>
                    {concepts.filter(c => c.category === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Search bar */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search concepts…"
            className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-brand-text-secondary font-semibold">No concepts found</p>
            <p className="text-brand-text-muted text-sm">Add your first payroll concept to get started.</p>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors">
              <Plus className="h-4 w-4" /> Add Concept
            </button>
          </div>
        ) : activeTab !== 'all' ? (
          /* Single category grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => (
              <ConceptCard key={c._id} concept={c} onEdit={openEdit} onToggle={toggleActive} />
            ))}
          </div>
        ) : (
          /* All tab — grouped by category */
          <div className="space-y-8">
            {TABS.slice(1).map(({ key, label }) => {
              const items = grouped[key] ?? [];
              if (items.length === 0) return null;
              const cat = CATEGORY_CFG[key as ConceptCategory];
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <h2 className="text-sm font-bold text-brand-text-secondary uppercase tracking-wider">{label}</h2>
                    <span className="text-xs text-brand-text-muted">{items.length} concept{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(c => (
                      <ConceptCard key={c._id} concept={c} onEdit={openEdit} onToggle={toggleActive} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <ConceptDrawer
          concept={editTarget}
          onClose={closeDrawer}
          onSaved={fetchConcepts}
        />
      )}
    </div>
  );
}
