'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  commendation: 'bg-success/10 text-success',
  verbal_warning: 'bg-warning/20 text-yellow-700',
  written_warning: 'bg-orange-100 text-orange-700',
  disciplinary_action: 'bg-danger/10 text-danger',
  general_note: 'bg-gray-100 text-gray-600',
};

export function NotesTab({ employeeId }: { employeeId: string }) {
  const t = useTranslations('Employees');
  const [notes, setNotes] = useState<any[]>([]);

  const fetch = () => apiCallFunction<any>({
    url: `${API_BASE_URL}/staff-notes/${employeeId}`,
    showToast: false,
    thenFn: (r) => setNotes(r.data ?? []),
  });

  useEffect(() => { fetch(); }, [employeeId]);

  const del = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/staff-notes/${id}`,
    method: 'DELETE',
    thenFn: () => fetch(),
  });

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <h3 className="font-semibold">{t('notes')}</h3>
      {notes.length === 0 ? (
        <p className="text-sm text-foreground/50">No notes recorded.</p>
      ) : notes.map((n) => (
        <div key={n._id} className="flex gap-3 p-3 border rounded-lg">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium self-start whitespace-nowrap', CATEGORY_COLORS[n.category] ?? 'bg-gray-100 text-gray-600')}>
            {n.category.replace(/_/g, ' ')}
          </span>
          <p className="text-sm flex-1">{n.note}</p>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-danger" onClick={() => del(n._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
