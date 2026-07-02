'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { DEPARTMENTS, DESIGNATIONS } from '../../employees/Components/EmployeeSchema';

const JOB_CATEGORIES = [
  'Administrative', 'Technical', 'Management', 'Finance', 'ICT',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal',
  'Procurement', 'Human Resources', 'Support Staff',
];

interface StageReq {
  stage: string;
  description: string;
  yearsOfExperience: string;
  requiresAdminApproval: boolean;
}

interface FormState {
  jobTitle: string;
  designation: string;
  jobCategory: string;
  department: string;
  jobDescription: string;
  salaryBandMin: string;
  salaryBandMax: string;
  numberOfOpenings: string;
  yearsOfExperience: string;
  requiredQualifications: string;
  stageRequirements: StageReq[];
}

const BLANK: FormState = {
  jobTitle: '', designation: '', jobCategory: '', department: '',
  jobDescription: '', salaryBandMin: '', salaryBandMax: '',
  numberOfOpenings: '1', yearsOfExperience: '',
  requiredQualifications: '',
  stageRequirements: [],
};

const STAGES = ['applied', 'shortlisted', 'interview_scheduled', 'offer_sent', 'hired', 'rejected'];

interface Props {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  mode?: 'create' | 'edit';
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
      {label}{required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

function StyledInput({ value, onChange, type = 'text', placeholder, required }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="h-10 border border-gray-200 rounded-xl px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
    />
  );
}

function StyledSelect({ value, onChange, options, placeholder, required }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="appearance-none h-10 border border-gray-200 rounded-xl px-3 pr-8 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 pointer-events-none" />
    </div>
  );
}

export function JobPositionForm({ onClose, onSubmit, initialValues, mode = 'create' }: Props) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initialValues) return BLANK;
    return {
      jobTitle: String(initialValues.jobTitle ?? ''),
      designation: String(initialValues.designation ?? ''),
      jobCategory: String(initialValues.jobCategory ?? ''),
      department: String(initialValues.department ?? ''),
      jobDescription: String(initialValues.jobDescription ?? ''),
      salaryBandMin: initialValues.salaryBandMin != null ? String(initialValues.salaryBandMin) : '',
      salaryBandMax: initialValues.salaryBandMax != null ? String(initialValues.salaryBandMax) : '',
      numberOfOpenings: initialValues.numberOfOpenings != null ? String(initialValues.numberOfOpenings) : '1',
      yearsOfExperience: initialValues.yearsOfExperience != null ? String(initialValues.yearsOfExperience) : '',
      requiredQualifications: Array.isArray(initialValues.requiredQualifications)
        ? (initialValues.requiredQualifications as string[]).join('\n')
        : '',
      stageRequirements: (initialValues.stageRequirements as StageReq[] | undefined) ?? [],
    };
  });

  const set = (field: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const addStageReq = () =>
    setForm((f) => ({
      ...f,
      stageRequirements: [
        ...f.stageRequirements,
        { stage: 'shortlisted', description: '', yearsOfExperience: '', requiresAdminApproval: true },
      ],
    }));

  const updateStageReq = (i: number, field: keyof StageReq, val: string | boolean) =>
    setForm((f) => {
      const reqs = [...f.stageRequirements];
      reqs[i] = { ...reqs[i], [field]: val };
      return { ...f, stageRequirements: reqs };
    });

  const removeStageReq = (i: number) =>
    setForm((f) => ({ ...f, stageRequirements: f.stageRequirements.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobTitle: form.jobTitle,
      designation: form.designation || form.jobTitle,
      jobCategory: form.jobCategory,
      department: form.department,
      jobDescription: form.jobDescription,
      salaryBandMin: form.salaryBandMin ? Number(form.salaryBandMin) : null,
      salaryBandMax: form.salaryBandMax ? Number(form.salaryBandMax) : null,
      numberOfOpenings: Number(form.numberOfOpenings) || 1,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
      requiredQualifications: form.requiredQualifications
        ? form.requiredQualifications.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      stageRequirements: form.stageRequirements.map((r) => ({
        ...r,
        yearsOfExperience: r.yearsOfExperience ? Number(r.yearsOfExperience) : null,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-primary">{mode === 'edit' ? 'Edit Job Position' : 'Add Job Title'}</h2>
            <p className="text-xs text-foreground/50 mt-0.5">{mode === 'edit' ? 'Update the details for this position' : 'Define a reusable job role for your organisation'}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="job-title-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Job Title (full width) */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Job Title" required />
            <StyledInput value={form.jobTitle} onChange={(v) => set('jobTitle', v)} placeholder="e.g. Software Developer" required />
          </div>

          {/* Dropdowns row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Department" required />
              <StyledSelect
                value={form.department}
                onChange={(v) => set('department', v)}
                options={DEPARTMENTS}
                placeholder="Select department"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Designation" />
              <StyledSelect
                value={form.designation}
                onChange={(v) => set('designation', v)}
                options={DESIGNATIONS}
                placeholder="Select designation"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Job Category" />
              <StyledSelect
                value={form.jobCategory}
                onChange={(v) => set('jobCategory', v)}
                options={JOB_CATEGORIES}
                placeholder="Select category"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Years of Experience" />
              <StyledInput value={form.yearsOfExperience} onChange={(v) => set('yearsOfExperience', v)} type="number" placeholder="e.g. 3" />
            </div>
          </div>

          {/* Job description */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Job Description" />
            <textarea
              value={form.jobDescription}
              onChange={(e) => set('jobDescription', e.target.value)}
              rows={4}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
              placeholder="Describe the role, responsibilities, and requirements…"
            />
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="No. of Openings" required />
              <StyledInput value={form.numberOfOpenings} onChange={(v) => set('numberOfOpenings', v)} type="number" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Salary Min (KES)" />
              <CurrencyInput value={form.salaryBandMin} onChange={(v) => set('salaryBandMin', v)} placeholder="e.g. 50,000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Salary Max (KES)" />
              <CurrencyInput value={form.salaryBandMax} onChange={(v) => set('salaryBandMax', v)} placeholder="e.g. 90,000" />
            </div>
          </div>

          {/* Qualifications */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Required Qualifications (one per line)" />
            <textarea
              value={form.requiredQualifications}
              onChange={(e) => set('requiredQualifications', e.target.value)}
              rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
              placeholder={`e.g. Bachelor's degree in Education\nTSC registration\n3+ years teaching experience`}
            />
          </div>

          {/* Stage requirements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel label="Stage Requirements" />
              <button type="button" onClick={addStageReq}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Add Stage
              </button>
            </div>
            {form.stageRequirements.length === 0 && (
              <p className="text-xs text-foreground/40 italic bg-gray-50 rounded-xl p-3 text-center">No stage requirements defined.</p>
            )}
            {form.stageRequirements.map((req, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 mb-2 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <select
                      value={req.stage}
                      onChange={(e) => updateStageReq(i, 'stage', e.target.value)}
                      className="appearance-none h-8 w-full border border-gray-200 rounded-lg px-2 pr-7 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/40 pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => removeStageReq(i)} className="text-danger/60 hover:text-danger transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Requirements / criteria…"
                  value={req.description}
                  onChange={(e) => updateStageReq(i, 'description', e.target.value)}
                  className="h-8 w-full border border-gray-200 rounded-lg px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="Min. years exp."
                    value={req.yearsOfExperience}
                    onChange={(e) => updateStageReq(i, 'yearsOfExperience', e.target.value)}
                    className="h-8 w-36 border border-gray-200 rounded-lg px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-foreground/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={req.requiresAdminApproval}
                      onChange={(e) => updateStageReq(i, 'requiresAdminApproval', e.target.checked)}
                      className="rounded"
                    />
                    Requires admin approval
                  </label>
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="job-title-form" variant="accent">
            Save Job Title
          </Button>
        </div>
      </div>
    </div>
  );
}
