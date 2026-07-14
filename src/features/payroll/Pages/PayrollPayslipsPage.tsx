'use client';

import { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile, openFile } from '@/functions/downloadFile';

interface Payslip {
  _id: string;
  period: { month: number; year: number };
  grossPay: number; netPay: number; status: string;
  generatedAt: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

export default function PayrollPayslipsPage() {
  const [payslips,  setPayslips]  = useState<Payslip[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/payslips?limit=50`, showToast: false,
      thenFn: r => setPayslips(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-xl font-black text-brand-text tracking-tight">My Payslips</h1>
          <p className="text-xs text-brand-text-secondary mt-0.5">Your complete payslip history</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
        ) : payslips.length === 0 ? (
          <div className="py-20 text-center text-brand-text-muted text-sm">No payslips yet. Your payslips will appear here after each payroll cycle is closed.</div>
        ) : payslips.map(slip => {
          const isExp = expanded === slip._id;
          return (
            <div key={slip._id} className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                    <span className="text-xs font-black text-indigo-300">{String(slip.period.month).padStart(2,'0')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-text">{MONTHS[slip.period.month - 1]} {slip.period.year}</p>
                    <p className="text-[11px] text-brand-text-muted">Generated {new Date(slip.generatedAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] text-brand-text-muted">Gross</p>
                    <p className="text-sm font-semibold text-brand-text-secondary">{fmt(slip.grossPay)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-brand-text-muted">Net Take-Home</p>
                    <p className="text-base font-black text-emerald-400">{fmt(slip.netPay)}</p>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    Paid ✓
                  </span>
                  <button onClick={() => downloadFile(`${API_BASE_URL}/payroll/payslips/${slip._id}/pdf`, `payslip-${slip._id}.pdf`).catch(err => alert(err.message))}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors" title="Download PDF">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setExpanded(isExp ? null : slip._id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted transition-colors">
                    {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {isExp && (
                <div className="border-t border-brand-border/60 px-5 py-4 text-xs text-brand-text-muted text-center">
                  <button onClick={() => openFile(`${API_BASE_URL}/payroll/payslips/${slip._id}/pdf`).catch(err => alert(err.message))}
                    className="text-indigo-400 underline">Open full payslip PDF</button> to see the complete earnings and deductions breakdown.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
