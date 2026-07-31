'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { ItemSchema, type ItemFormValues } from '../schemas';
import type { InventoryItem, InventoryCategory, InventoryBrand, InventoryUnitOfMeasure, CustomFieldDef } from '../types';
import { useInventoryItems } from '../Hooks/useInventoryItems';

interface Props {
  item: InventoryItem | null;
  categories: InventoryCategory[];
  brands: InventoryBrand[];
  units: InventoryUnitOfMeasure[];
  fieldDefs: CustomFieldDef[];
  onClose: () => void;
}

export function ItemFormDrawer({ item, categories, brands, units, fieldDefs, onClose }: Props) {
  const t = useTranslations('Inventory');
  const isEdit = !!item;
  const { createItem, updateItem } = useInventoryItems();
  const [saving, setSaving] = useState(false);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(item?.customFieldValues as Record<string, string> ?? {});

  const { control, handleSubmit, watch, setValue } = useForm<ItemFormValues>({
    resolver: zodResolver(ItemSchema),
    defaultValues: item ? {
      sku: item.sku, name: item.name, description: item.description, category: item.category ?? undefined, brand: item.brand ?? undefined,
      unitOfMeasure: item.unitOfMeasure, costPrice: item.costPrice, salePrice: item.salePrice, barcode: item.barcode ?? undefined,
      isTracked: item.isTracked, trackingMode: item.trackingMode, expiryTrackingEnabled: item.expiryTrackingEnabled,
      discountType: item.discountType, discountValue: item.discountValue ?? undefined,
      taxCategory: item.taxCategory, taxRate: item.taxRate,
    } : {
      isTracked: true, trackingMode: 'none', expiryTrackingEnabled: false, costPrice: 0, salePrice: 0,
      discountType: null, taxCategory: 'standard', taxRate: 16,
    },
  });

  const isTracked = watch('isTracked');
  const trackingMode = watch('trackingMode');
  const discountType = watch('discountType');
  const taxCategory = watch('taxCategory');

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.name }));
  const brandOptions = brands.map((b) => ({ label: b.name, value: b.name }));
  const unitOptions = units.map((u) => ({ label: u.name, value: u.name }));
  const trackingOptions = [
    { label: t('items.trackingNone'), value: 'none' },
    { label: t('items.trackingLot'), value: 'lot' },
    { label: t('items.trackingSerial'), value: 'serial' },
    { label: t('items.trackingBatch'), value: 'batch' },
  ];

  const submit = (values: ItemFormValues) => {
    setSaving(true);
    const payload = { ...values, customFieldValues };
    const done = () => { setSaving(false); onClose(); };
    if (isEdit) {
      updateItem(item!._id, payload)?.then(done).catch(() => setSaving(false));
    } else {
      createItem(payload)?.then(done).catch(() => setSaving(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900">{isEdit ? t('items.editItem') : t('items.addItem')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <CustomInput component="text" name="sku" control={control} label={t('items.sku')} required />
                </div>
                <button
                  type="button"
                  disabled={generatingSku}
                  onClick={async () => {
                    setGeneratingSku(true);
                    await apiCallFunction<{ data: { sku: string } }>({
                      url: `${API_BASE_URL}/inventory/items/suggest-sku`,
                      params: { category: watch('category'), brand: watch('brand') },
                      showToast: false,
                      returnResponse: true,
                      thenFn: (res) => setValue('sku', res.data.sku),
                    });
                    setGeneratingSku(false);
                  }}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {generatingSku ? t('common.saving') : t('items.generateSku')}
                </button>
              </div>
            </div>
            <CustomInput component="select" name="unitOfMeasure" control={control} label={t('items.unitOfMeasure')} options={unitOptions} placeholder={t('common.select')} required />
          </div>
          <CustomInput component="text" name="name" control={control} label={t('items.itemName')} required />
          <CustomInput component="textarea" name="description" control={control} label={t('items.description')} />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput component="select" name="category" control={control} label={t('items.category')} options={categoryOptions} placeholder={t('common.select')} />
            <CustomInput component="select" name="brand" control={control} label={t('items.brand')} options={brandOptions} placeholder={t('common.select')} />
          </div>
          <CustomInput component="text" name="barcode" control={control} label={t('items.barcode')} />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput component="number" name="costPrice" control={control} label={t('items.costPrice')} />
            <CustomInput component="number" name="salePrice" control={control} label={t('items.salePrice')} />
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('items.discountAndTax')}</p>
            <div className="grid grid-cols-2 gap-3">
              <CustomInput component="select" name="discountType" control={control} label={t('items.discountType')}
                options={[{ label: t('items.percentage'), value: 'percentage' }, { label: t('items.fixedAmount'), value: 'fixed' }]}
                placeholder={t('items.noDiscount')} />
              {discountType && <CustomInput component="number" name="discountValue" control={control} label={t('items.discountValue')} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CustomInput component="select" name="taxCategory" control={control} label={t('items.taxCategory')}
                options={[
                  { label: t('items.taxStandard'), value: 'standard' },
                  { label: t('items.taxZeroRated'), value: 'zero_rated' },
                  { label: t('items.taxExempt'), value: 'exempt' },
                ]} />
              {taxCategory === 'standard' && <CustomInput component="number" name="taxRate" control={control} label={t('items.taxRate')} />}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <Controller control={control} name="isTracked" render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} disabled={isEdit} />
                {t('items.tracked')}
              </label>
            )} />
            {isTracked && (
              <>
                <CustomInput component="select" name="trackingMode" control={control} label={t('items.trackingMode')} options={trackingOptions} />
                {trackingMode !== 'none' && (
                  <Controller control={control} name="expiryTrackingEnabled" render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      {t('items.expiryTracking')}
                    </label>
                  )} />
                )}
              </>
            )}
          </div>

          {fieldDefs.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('items.customFields')}</p>
              {fieldDefs.map((def) => (
                <div key={def._id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">{def.name}</label>
                  {def.fieldType === 'select' ? (
                    <select
                      value={customFieldValues[def._id] ?? ''}
                      onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def._id]: e.target.value }))}
                      className="h-9 border border-slate-200 rounded-lg px-2 text-sm"
                    >
                      <option value="">{t('common.select')}</option>
                      {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def.fieldType === 'number' ? 'number' : def.fieldType === 'date' ? 'date' : 'text'}
                      value={customFieldValues[def._id] ?? ''}
                      onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def._id]: e.target.value }))}
                      className="h-9 border border-slate-200 rounded-lg px-2 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={saving} className="bg-brand-primary text-white">
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
