'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

interface TrendPoint { month: number; year: number; totalGross: number; totalNet: number }
interface DeptRow { department: string; totalGross: number; totalNet: number; employeeCount: number }
interface AvgRow { department: string; avgGross: number }
interface TopEarner { employeeId: string; fullName: string; department: string; staffNumber: string; netPay: number }

interface AnalyticsData {
  latestPeriod?: { month: number; year: number };
  monthlyTrend: TrendPoint[];
  departmentBreakdown: DeptRow[];
  topEarners: TopEarner[];
  avgSalaryByDepartment: AvgRow[];
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-slate-100 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

export default function PayrollAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/analytics`, showToast: false,
      thenFn: r => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const trendData = (data?.monthlyTrend ?? []).map(t => ({ label: `${MONTHS[t.month - 1]} ${t.year}`, 'Net Payroll': t.totalNet }));

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="border-b border-slate-700/60 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">Payroll Analytics</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {data?.latestPeriod ? `Department figures reflect ${MONTHS[data.latestPeriod.month - 1]} ${data.latestPeriod.year} — the most recently closed run` : 'Org-wide payroll cost and trends'}
            </p>
          </div>
          <a href="/en/payroll" className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">← Back to Payroll</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
        ) : !data || data.monthlyTrend.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm">No closed payroll runs yet — analytics will appear once a cycle is closed.</div>
        ) : (
          <>
            <ChartCard title="Total Net Payroll — Trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="Net Payroll" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Payroll Spend by Department">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.departmentBreakdown} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalGross" name="Total Gross" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average Gross Salary by Department">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.avgSalaryByDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="avgGross" name="Avg Gross" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Top Earners (Latest Run)">
              <div className="divide-y divide-slate-700/60">
                {data.topEarners.map((e, i) => (
                  <div key={e.employeeId} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                        {i < 3 ? <Trophy className="h-3 w-3" /> : i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{e.fullName}</p>
                        <p className="text-[10px] text-slate-500">{e.department} · {e.staffNumber}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-100">{fmt(e.netPay)}</span>
                  </div>
                ))}
                {data.topEarners.length === 0 && <p className="text-sm text-slate-600 text-center py-6">No data.</p>}
              </div>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}
