'use client';
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { SKILLS_CATALOG } from '@/lib/skillsCatalog';

const OTHER = '__other__';

// Dropdown-first skill picker backed by SKILLS_CATALOG (already populated, ~70 common
// skills) — picking a catalog skill adds it immediately, no extra button click needed.
// "Other" is the one exception: it's a placeholder-like option that reveals a free-text
// input for anything not in the list, confirmed via its own Add button/Enter key.
// Used on both the HR-side employee profile and the staff self-service Skills section.
export function SkillPicker({ existing, saving, onAdd, selectClassName, inputClassName, buttonClassName }: {
  existing: string[];
  saving: boolean;
  onAdd: (skill: string) => void;
  selectClassName: string;
  inputClassName: string;
  buttonClassName: string;
}) {
  const [isOther, setIsOther] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const options = SKILLS_CATALOG.filter((s) => !existing.includes(s));

  const handleSelect = (v: string) => {
    if (v === OTHER) { setIsOther(true); return; }
    if (v && !existing.includes(v)) onAdd(v);
  };

  const submitCustom = () => {
    const value = customValue.trim();
    if (!value || existing.includes(value)) return;
    onAdd(value);
    setCustomValue('');
    setIsOther(false);
  };

  if (isOther) {
    return (
      <div className="flex gap-2 flex-wrap">
        <input
          autoFocus
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitCustom(); } }}
          placeholder="Type your skill…"
          className={inputClassName}
        />
        <button type="button" onClick={submitCustom} disabled={saving || !customValue.trim()} className={buttonClassName}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </button>
        <button type="button" onClick={() => { setIsOther(false); setCustomValue(''); }} className="text-xs text-brand-text-muted hover:text-brand-text self-center">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select value="" onChange={(e) => handleSelect(e.target.value)} className={selectClassName}>
      <option value="">Select a skill…</option>
      {options.map((s) => <option key={s} value={s}>{s}</option>)}
      <option value={OTHER}>Other (type your own)</option>
    </select>
  );
}
