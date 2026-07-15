'use client';

import { Button } from '@/components/ui/button';

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-5">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="bg-brand-primary text-white" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
