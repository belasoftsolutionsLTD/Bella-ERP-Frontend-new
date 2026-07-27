'use client';

import { Button } from '@/components/ui/button';

// Shared two-step "are you sure?" confirmation — used anywhere an action can't be
// undone (or shouldn't happen from a single click): approvals, revokes, deletions,
// final submissions. Replaces native window.confirm()/alert() dialogs, which look
// like a browser/OS error ("localhost:3000 says...") rather than part of the app.
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'default', onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'default' | 'danger';
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
          <Button
            className={variant === 'danger' ? 'bg-brand-danger text-white hover:bg-brand-danger/90' : 'bg-brand-primary text-white'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
