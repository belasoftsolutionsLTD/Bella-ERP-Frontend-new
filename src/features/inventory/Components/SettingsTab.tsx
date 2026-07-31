'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { useInventoryCategories, useInventoryBrands, useUnitsOfMeasure, useCustomFieldDefs, useInventoryStaffAccess } from '../Hooks/useInventoryConfig';

function CategoriesPanel() {
  const t = useTranslations('Inventory');
  const { categories, createCategory, deleteCategory } = useInventoryCategories();
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.categories')}</p>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.categoryName')}
          className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (name.trim()) { createCategory(name.trim()); setName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <span key={c._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {c.name}
            <button onClick={() => deleteCategory(c._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function BrandsPanel() {
  const t = useTranslations('Inventory');
  const { brands, createBrand, deleteBrand } = useInventoryBrands();
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.brands')}</p>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.brandName')}
          className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (name.trim()) { createBrand(name.trim()); setName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {brands.map((b) => (
          <span key={b._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {b.name}
            <button onClick={() => deleteBrand(b._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function UnitsOfMeasurePanel() {
  const t = useTranslations('Inventory');
  const { units, createUnit, deleteUnit } = useUnitsOfMeasure();
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.unitsOfMeasure')}</p>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.unitName')}
          className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (name.trim()) { createUnit(name.trim()); setName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {units.map((u) => (
          <span key={u._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {u.name}
            <button onClick={() => deleteUnit(u._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function CustomFieldsPanel() {
  const t = useTranslations('Inventory');
  const { fieldDefs, createDef, deleteDef } = useCustomFieldDefs();
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [options, setOptions] = useState('');

  const add = () => {
    if (!name.trim()) return;
    createDef({ name: name.trim(), fieldType, options: fieldType === 'select' ? options.split(',').map((o) => o.trim()).filter(Boolean) : undefined });
    setName(''); setOptions('');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.customFields')}</p>
      <div className="flex items-center gap-2 flex-wrap">
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
        <button onClick={add} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
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

function StaffAccessPanel() {
  const t = useTranslations('Inventory');
  const { staff, setClerkFlag } = useInventoryStaffAccess();

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.staffAccess')}</p>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {staff.map((u) => (
          <div key={u._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div>
              <p className="text-slate-800">{u.name}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              {t('settings.grantClerkAccess')}
              <input type="checkbox" checked={u.isInventoryClerk} onChange={(e) => setClerkFlag(u._id, e.target.checked)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <CategoriesPanel />
      <BrandsPanel />
      <UnitsOfMeasurePanel />
      <CustomFieldsPanel />
      <StaffAccessPanel />
    </div>
  );
}
