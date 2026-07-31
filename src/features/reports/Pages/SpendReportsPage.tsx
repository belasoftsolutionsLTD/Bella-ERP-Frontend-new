'use client';

import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ErrorBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
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
  const { data: expenses, loading: eLoading, error: eError, refetch: eRefetch } = useReportQuery<ExpenseAnalytics>('/spend/expenses');
  const { data: procurement, loading: prLoading, error: prError, refetch: prRefetch } = useReportQuery<ProcurementSpend>('/spend/procurement');
  const { data: vendors, loading: vLoading, error: vError, refetch: vRefetch } = useReportQuery<VendorAnalytics[]>('/spend/vendors');
  const { data: pending, loading: pLoading, error: pError, refetch: pRefetch } = useReportQuery<Pending>('/spend/pending');
  const loading = eLoading || prLoading || vLoading || pLoading;
  const error = eError || prError || vError || pError;
  const refetch = () => { eRefetch(); prRefetch(); vRefetch(); pRefetch(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Spend Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Expense claims and procurement spend in one view</p>
      </div>
      <ReportsNav active="spend" />

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading ? <LoadingBlock /> : (
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
                        <Pie data={expenses.byCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%"
                          outerRadius={85} innerRadius={48} paddingAngle={2}>
                          {expenses.byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
                <ChartCard title="Expense Trend by Month">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={expenses.byMonth.map((total, i) => ({ month: MONTH_ABBR[i], total }))}>
                      <defs>
                        <linearGradient id="spendMonthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="total" name="Amount (KES)" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#spendMonthGrad)" dot={{ fill: CHART_COLORS[0], r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard title="Top Spenders" action={<ExportCSVButton rows={expenses.topSpenders.map((s) => ({ employee: s.employee?.fullName, department: s.employee?.department, total: s.total, count: s.count }))} filename="top-spenders.csv" />}>
                <div className="divide-y divide-slate-700/60">
                  {expenses.topSpenders.map((s) => (
                    <div key={s._id} className="flex items-center justify-between py-2.5 text-sm">
                      <div><p className="text-brand-text">{s.employee?.fullName ?? 'Unknown'}</p><p className="text-xs text-slate-500">{s.employee?.department}</p></div>
                      <span className="text-brand-text-secondary font-semibold">{fmtKES(s.total)} <span className="text-xs text-slate-500">({s.count})</span></span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )}

          {procurement && (
            <ChartCard title="Procurement Spend by Department">
              {procurement.byDepartment.length === 0 ? <p className="text-sm text-slate-500 text-center py-10">No purchase requests recorded.</p> : (
                <ResponsiveContainer width="100%" height={Math.max(220, procurement.byDepartment.length * 20)}>
                  <PieChart>
                    <Pie data={procurement.byDepartment} dataKey="total" nameKey="department" cx="50%" cy="50%"
                      outerRadius={85} innerRadius={48} paddingAngle={2}>
                      {procurement.byDepartment.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
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
                      <div><p className="text-brand-text">{v.vendor?.name ?? 'Unknown Vendor'}</p><p className="text-xs text-slate-500">{v.vendor?.category} · {v.orderCount} orders</p></div>
                      <span className="text-brand-text-secondary font-semibold">{fmtKES(v.totalSpend)}</span>
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
