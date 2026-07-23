'use client';
import { useEffect, useState } from 'react';
import { Laptop, Smartphone, Monitor, Package, Cpu, HardDrive } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const TYPE_ICON: Record<string, React.ElementType> = {
  laptop: Laptop,
  computer: Cpu,
  mobile: Smartphone,
  monitor: Monitor,
  storage: HardDrive,
};

function deviceIcon(type: string) {
  const key = type?.toLowerCase() ?? '';
  for (const [k, Icon] of Object.entries(TYPE_ICON)) {
    if (key.includes(k)) return Icon;
  }
  return Package;
}

const CONDITION_COLOR: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good:      'bg-blue-100 text-blue-700',
  fair:      'bg-amber-100 text-amber-700',
  poor:      'bg-red-100 text-red-700',
};

interface Device {
  _id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  assetTag?: string;
}

export function AssetsTab({ employeeId }: { employeeId: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/it/devices?employeeId=${employeeId}&limit=50`,
      method: 'GET',
      thenFn: (r) => setDevices(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-400">Loading assets…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Assigned Assets</h3>
        <span className="text-xs text-slate-400">{devices.length} device{devices.length !== 1 ? 's' : ''}</span>
      </div>

      {devices.length === 0 ? (
        <div className="bg-gray-50 border border-brand-border rounded-xl px-4 py-8 text-center">
          <Package className="h-8 w-8 text-brand-text-secondary mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No assets assigned</p>
          <p className="text-xs text-slate-400 mt-1">Assign devices from the Asset Management module.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map((d) => {
            const Icon = deviceIcon(d.type);
            const condColor = CONDITION_COLOR[d.condition?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-600';
            return (
              <div key={d._id} className="bg-gray-50 border border-brand-border rounded-xl p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-white border border-brand-border flex items-center justify-center shadow-sm shrink-0">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 truncate">{[d.brand, d.model].filter(Boolean).join(' · ') || d.type}</p>
                  {d.serialNumber && <p className="text-[10px] text-slate-400 mt-0.5">S/N: {d.serialNumber}</p>}
                </div>
                {d.condition && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${condColor}`}>
                    {d.condition}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
