'use client';
import { useClientInformation } from '@/hooks/useClientInformation';

export function MyProfileTab() {
  const { userData } = useClientInformation();
  if (!userData) return null;
  return (
    <div className="rounded-xl border bg-white p-5 grid grid-cols-2 gap-4 text-sm">
      {Object.entries(userData as Record<string, unknown>)
        .filter(([k]) => !['password', 'employeeId'].includes(k))
        .map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-foreground/50 capitalize mb-0.5">{k}</p>
            <p className="font-medium">{String(v ?? '—')}</p>
          </div>
        ))}
    </div>
  );
}
