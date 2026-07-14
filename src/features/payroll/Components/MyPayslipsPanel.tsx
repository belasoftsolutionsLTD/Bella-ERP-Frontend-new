'use client';
import { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile, openFile } from '@/functions/downloadFile';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

export interface MyPayslipResult {
  earnings: { conceptName: string; amount: number }[];
  deductions: { conceptName: string; amount: number; source?: string; balanceAfter?: number }[];
  benefits: { conceptName: string; amount: number }[];
  employerContributions: { conceptName: string; amount: number }[];
  statutoryDeductions?: { paye: number; nssf: number; sha: number; ahl: number; total: number; labels: Record<string, string> };
  overtimeAmount?: number;
  overtimeHours?: number;
  expenseReimbursements?: number;
  leave?: { leaveType: string; startDate: string; endDate: string; days: number; amount: number }[];
}

export interface MyPayslip {
  _id: string;
  period: { month: number; year: number };
  grossPay: number;
  netPay: number;
  status: string;
  generatedAt: string;
  result: MyPayslipResult | null;
}

// Read-only, self-service payslip view — sources from the Cycles engine (payroll_results +
// payslips), never payroll_summaries. No HR mutation actions (approve/disburse/edit) belong
// here; this is what an employee sees about their own pay, nothing more.
export function MyPayslipsPanel({ payslips }: { payslips: MyPayslip[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (payslips.length === 0) return null;

  return (
    <div className="space-y-3">
      {payslips.map((slip) => {
        const isExp = expanded === slip._id;
        const r = slip.result;
        return (
          <div key={slip._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-black text-primary">{String(slip.period.month).padStart(2, '0')}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{MONTHS[slip.period.month - 1]} {slip.period.year}</p>
                  <p className="text-[11px] text-slate-500">Generated {new Date(slip.generatedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Gross</p>
                  <p className="text-sm font-semibold text-slate-700">{fmt(slip.grossPay)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Net Take-Home</p>
                  <p className="text-base font-black text-emerald-600">{fmt(slip.netPay)}</p>
                </div>
                <button
                  onClick={() => downloadFile(`${API_BASE_URL}/payroll/payslips/${slip._id}/pdf`, `payslip-${slip.period.year}-${slip.period.month}.pdf`).catch((err) => alert(err.message))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setExpanded(isExp ? null : slip._id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isExp && (
              <div className="border-t border-slate-200 px-5 py-4 space-y-3 text-sm">
                {r ? (
                  <>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">Earnings</p>
                      {[...r.earnings, ...r.benefits].map((e, i) => (
                        <div key={i} className="flex justify-between py-1 text-slate-600"><span>{e.conceptName}</span><span className="font-medium text-slate-800">{fmt(e.amount)}</span></div>
                      ))}
                      {(r.overtimeAmount ?? 0) > 0 && (
                        <div className="flex justify-between py-1 text-slate-600"><span>Overtime ({r.overtimeHours} hrs)</span><span className="font-medium text-slate-800">{fmt(r.overtimeAmount!)}</span></div>
                      )}
                      {(r.expenseReimbursements ?? 0) > 0 && (
                        <div className="flex justify-between py-1 text-slate-600"><span>Expense Reimbursements</span><span className="font-medium text-slate-800">{fmt(r.expenseReimbursements!)}</span></div>
                      )}
                    </div>
                    {(r.leave?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-1.5">Leave Taken</p>
                        {r.leave!.map((l, i) => (
                          <div key={i} className="flex justify-between py-1 text-slate-600">
                            <span>{l.leaveType.charAt(0).toUpperCase()}{l.leaveType.slice(1)} Leave ({l.days} day{l.days === 1 ? '' : 's'})</span>
                            <span className="font-medium text-slate-800">{l.amount > 0 ? `-${fmt(l.amount)}` : 'Paid'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.statutoryDeductions && (
                      <div>
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5">Statutory Deductions</p>
                        {r.statutoryDeductions.paye > 0 && <div className="flex justify-between py-1 text-slate-600"><span>{r.statutoryDeductions.labels?.paye || 'PAYE'}</span><span className="font-medium text-slate-800">{fmt(r.statutoryDeductions.paye)}</span></div>}
                        {r.statutoryDeductions.nssf > 0 && <div className="flex justify-between py-1 text-slate-600"><span>{r.statutoryDeductions.labels?.nssf || 'NSSF'}</span><span className="font-medium text-slate-800">{fmt(r.statutoryDeductions.nssf)}</span></div>}
                        {r.statutoryDeductions.sha > 0 && <div className="flex justify-between py-1 text-slate-600"><span>{r.statutoryDeductions.labels?.sha || 'SHA'}</span><span className="font-medium text-slate-800">{fmt(r.statutoryDeductions.sha)}</span></div>}
                        {r.statutoryDeductions.ahl > 0 && <div className="flex justify-between py-1 text-slate-600"><span>{r.statutoryDeductions.labels?.ahl || 'Housing Levy'}</span><span className="font-medium text-slate-800">{fmt(r.statutoryDeductions.ahl)}</span></div>}
                      </div>
                    )}
                    {r.deductions.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1.5">Other Deductions</p>
                        {r.deductions.map((d, i) => (
                          <div key={i} className="flex justify-between py-1 text-slate-600">
                            <span>
                              {d.conceptName}
                              {d.source === 'loan' && (
                                <span className="text-slate-400 text-xs ml-1">
                                  ({(d.balanceAfter ?? 0) > 0 ? `Balance: ${fmt(d.balanceAfter ?? 0)} remaining` : 'Fully repaid'})
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-slate-800">{fmt(d.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={cn('flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900')}>
                      <span>Net Pay</span><span>{fmt(slip.netPay)}</span>
                    </div>
                  </>
                ) : (
                  <button onClick={() => openFile(`${API_BASE_URL}/payroll/payslips/${slip._id}/pdf`).catch((err) => alert(err.message))} className="text-primary underline text-xs">
                    Open full payslip PDF
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
