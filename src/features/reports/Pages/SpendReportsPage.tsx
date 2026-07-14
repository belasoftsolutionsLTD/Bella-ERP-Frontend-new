'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface ExpenseAnalytics {
  byCategory: { _id: string; total: number; count: number }[];
  byMonth: number[];
  byDept: { _id: string; total: number }[];
  topSpenders: { _id: string; total: number; count: number; employee: { fullName: string; department?: string } | null }[];
}
interface ProcurementSpend { byDepartment: { department: string; total: number }[]; }
interface VendorAnalytics { _id: string | null; totalSpend: number; orderCount: number; vendor: { name: string; category?: string } | null; }
interface Pending { pendingExpenseClaims: { count: number; amount: number }; pendingPurchaseRequests: number; pendingInvoiceApprovals: number; }

const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SpendReportsPage() {
  const { data: expenses, loading: eLoading } = useReportQuery<ExpenseAnalytics>('/spend/expenses');
  const { data: procurement, loading: prLoading } = useReportQuery<ProcurementSpend>('/spend/procurement');
  const { data: vendors, loading: vLoading } = useReportQuery<VendorAnalytics[]>('/spend/vendors');
  const { data: pending, loading: pLoading } = useReportQuery<Pending>('/spend/pending');
  const loading = eLoading || prLoading || vLoading || pLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Spend Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Expense claims and procurement spend in one view</p>
      </div>
      <ReportsNav active="spend" />

      {loading ? <LoadingBlock /> : (
        <>
          {pending && (
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Pending Expense Claims" value={`${pending.pendingExpenseClaims.count} (${fmtKES(pending.pendingExpenseClaims.amount)})`} colorCls="text-amber-400" />
              <StatTile label="Pending Purchase Requests" value={pending.pendingPurchaseRequests} colorCls="text-sky-400" />
              <StatTile label="Pending Invoice Approvals" value={pending.pendingInvoiceApprovals} colorCls="text-red-400" />
            </div>
          )}

          {expenses && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Expense Claims by Category">
                  {expenses.byCategory.length === 0 ? <p className="text-sm text-slate-500 text-center py-16">No approved claims this year.</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={expenses.byCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={85} label={(e: any) => e._id}>
                          {expenses.byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
                <ChartCard title="Expense Trend by Month">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={expenses.byMonth.map((total, i) => ({ month: MONTH_ABBR[i], total }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="total" name="Amount (KES)" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard title="Top Spenders" action={<ExportCSVButton rows={expenses.topSpenders.map((s) => ({ employee: s.employee?.fullName, department: s.employee?.department, total: s.total, count: s.count }))} filename="top-spenders.csv" />}>
                <div className="divide-y divide-slate-700/60">
                  {expenses.topSpenders.map((s) => (
                    <div key={s._id} className="flex items-center justify-between py-2.5 text-sm">
                      <div><p className="text-slate-200">{s.employee?.fullName ?? 'Unknown'}</p><p className="text-xs text-slate-500">{s.employee?.department}</p></div>
                      <span className="text-slate-300 font-semibold">{fmtKES(s.total)} <span className="text-xs text-slate-500">({s.count})</span></span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )}

          {procurement && (
            <ChartCard title="Procurement Spend by Department">
              {procurement.byDepartment.length === 0 ? <p className="text-sm text-slate-500 text-center py-10">No purchase requests recorded.</p> : (
                <ResponsiveContainer width="100%" height={Math.max(180, procurement.byDepartment.length * 34)}>
                  <BarChart data={procurement.byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total" name="Estimated Cost (KES)" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          {vendors && (
            <ChartCard title="Purchase Order Value by Vendor">
              {vendors.length === 0 ? <p className="text-sm text-slate-500 text-center py-10">No purchase orders recorded.</p> : (
                <div className="divide-y divide-slate-700/60">
                  {vendors.map((v) => (
                    <div key={v._id ?? 'unknown'} className="flex items-center justify-between py-2.5 text-sm">
                      <div><p className="text-slate-200">{v.vendor?.name ?? 'Unknown Vendor'}</p><p className="text-xs text-slate-500">{v.vendor?.category} · {v.orderCount} orders</p></div>
                      <span className="text-slate-300 font-semibold">{fmtKES(v.totalSpend)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
