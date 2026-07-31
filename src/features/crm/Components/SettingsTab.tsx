'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { usePipelines, useCustomFieldDefs } from '../Hooks/useCrmConfig';
import type { CustomFieldAppliesTo, PipelineStage } from '../types';

// Same palette as the backend default-assignment (crmPipelinesFunctions.js) — kept in
// sync manually since there's no shared constants module between front/back in this repo.
const STAGE_COLOR_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

function PipelinesPanel() {
  const t = useTranslations('CRM');
  const { pipelines, createPipeline, updatePipeline, deletePipeline } = usePipelines();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  const startEdit = (id: string, current: PipelineStage[]) => { setEditingId(id); setStages(current.map((s) => ({ ...s }))); };
  const addStage = () => setStages((s) => [...s, { id: '', name: '', order: s.length, isWon: false, isLost: false, color: STAGE_COLOR_PALETTE[s.length % STAGE_COLOR_PALETTE.length] }]);
  const updateStage = (idx: number, patch: Partial<PipelineStage>) => setStages((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  const removeStage = (idx: number) => setStages((s) => s.filter((_, i) => i !== idx));
  const moveStage = (idx: number, dir: -1 | 1) => setStages((s) => {
    const next = [...s];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return s;
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
  });
  const saveStages = () => { if (editingId) updatePipeline(editingId, { stages }); setEditingId(null); };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.pipelines')}</p>
      <div className="flex items-center gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('settings.pipelineName')} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (newName.trim()) { createPipeline({ name: newName.trim() }); setNewName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>

      <div className="space-y-2">
        {pipelines.map((p) => (
          <div key={p._id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{p.name} {p.isDefault && <span className="text-[10px] text-brand-primary">({t('settings.default')})</span>}</p>
              <div className="flex items-center gap-2">
                {editingId !== p._id && <button onClick={() => startEdit(p._id, p.stages)} className="text-xs text-brand-primary font-semibold">{t('settings.editStages')}</button>}
                <button onClick={() => deletePipeline(p._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            {editingId === p._id ? (
              <div className="mt-2 space-y-1.5">
                {stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5">
                      {STAGE_COLOR_PALETTE.map((hex) => (
                        <button key={hex} type="button" onClick={() => updateStage(idx, { color: hex })}
                          title={hex}
                          className={`h-4 w-4 rounded-full shrink-0 ${stage.color === hex ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                          style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                    <input value={stage.name} onChange={(e) => updateStage(idx, { name: e.target.value })} className="h-8 flex-1 border border-slate-200 rounded px-2 text-xs" />
                    <label className="flex items-center gap-1 text-[10px] text-emerald-600"><input type="checkbox" checked={stage.isWon} onChange={(e) => updateStage(idx, { isWon: e.target.checked })} /> {t('pipelines.won')}</label>
                    <label className="flex items-center gap-1 text-[10px] text-red-500"><input type="checkbox" checked={stage.isLost} onChange={(e) => updateStage(idx, { isLost: e.target.checked })} /> {t('pipelines.lost')}</label>
                    <button onClick={() => moveStage(idx, -1)} className="text-slate-400 hover:text-slate-700"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveStage(idx, 1)} className="text-slate-400 hover:text-slate-700"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeStage(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={addStage} className="text-xs text-brand-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> {t('settings.addStage')}</button>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400">{t('common.cancel')}</button>
                    <button onClick={saveStages} className="text-xs font-semibold bg-brand-primary text-white px-3 py-1 rounded-lg">{t('common.save')}</button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">{p.stages.map((s) => s.name).join(' → ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomFieldsPanel() {
  const t = useTranslations('CRM');
  const [appliesTo, setAppliesTo] = useState<CustomFieldAppliesTo>('contact');
  const { fieldDefs, createDef, deleteDef } = useCustomFieldDefs(appliesTo);
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [options, setOptions] = useState('');

  const add = () => {
    if (!name.trim()) return;
    createDef({ name: name.trim(), fieldType, appliesTo, options: fieldType === 'select' ? options.split(',').map((o) => o.trim()).filter(Boolean) : undefined });
    setName(''); setOptions('');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.customFields')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as CustomFieldAppliesTo)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
          <option value="contact">{t('nav.contacts')}</option>
          <option value="company">{t('nav.companies')}</option>
          <option value="deal">{t('nav.pipeline')}</option>
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.fieldName')} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
          <option value="text">{t('settings.text')}</option>
          <option value="number">{t('settings.number')}</option>
          <option value="date">{t('settings.date')}</option>
          <option value="select">{t('settings.select')}</option>
        </select>
        {fieldType === 'select' && (
          <input value={options} onChange={(e) => setOptions(e.target.value)} placeholder={t('settings.options')} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        )}
        <button onClick={add} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {t('common.add')}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fieldDefs.map((f) => (
          <span key={f._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {f.name} <span className="text-slate-400">({t(`settings.${f.fieldType}`)})</span>
            <button onClick={() => deleteDef(f._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <PipelinesPanel />
      <CustomFieldsPanel />
    </div>
  );
}
