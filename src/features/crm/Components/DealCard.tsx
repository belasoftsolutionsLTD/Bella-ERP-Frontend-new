'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Deal } from '../types';

export function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal._id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-brand-primary/40 hover:shadow-sm transition',
        isDragging && 'opacity-40'
      )}
    >
      <p className="text-sm font-semibold text-slate-800 truncate">{deal.title}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1"><User className="h-3 w-3" /> {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}</p>
      <p className="text-sm font-bold text-brand-primary mt-1.5">{deal.value.toLocaleString()} {deal.currency}</p>
      {deal.nextAction && (
        <p className="text-[11px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 mt-1.5 truncate">{deal.nextAction.description}</p>
      )}
      {deal.expectedCloseDate && (
        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(deal.expectedCloseDate).toLocaleDateString()}</p>
      )}
    </div>
  );
}
