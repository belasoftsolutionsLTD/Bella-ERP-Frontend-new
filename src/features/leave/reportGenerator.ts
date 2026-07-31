import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBalance, LeaveRequest } from './types';
import { stampLogo } from '@/functions/getCompanyLogo';

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// Shared by the Employee Profile's Leave tab and the Leave Management request detail
// page — a full evidence record for one employee: every leave request on file (not
// capped at whatever a list view shows), with the reasons/rejections/disputes that
// explain "what happened" on each one. Same client-side jsPDF + inline data-URI pattern
// as the staff-facing single request PDF (MyLeaveRequestDetailPage.tsx) — no backend PDF
// service needed, and both callers show it in-page rather than a new tab for the same reason.
export async function generateLeaveHistoryReport(params: { employeeId: string; employeeName?: string; staffNumber?: string }): Promise<string> {
  const { employeeId, employeeName, staffNumber } = params;

  const balRes = await apiCallFunction<any>({ url: `${API_BASE_URL}/leave/balances/${employeeId}`, showToast: false, returnResponse: true });
  const allBalances: LeaveBalance[] = balRes?.data ?? [];

  // The backend caps a single page at 100 — for a genuine evidence record this has to be
  // every request on file, not just the first 100, so page through until done.
  const allRequests: LeaveRequest[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const reqRes: any = await apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests`, params: { employeeId, limit: 100, page }, showToast: false, returnResponse: true,
    });
    allRequests.push(...(reqRes?.data?.data ?? []));
    totalPages = reqRes?.data?.pagination?.pages || 1;
    page += 1;
  } while (page <= totalPages);

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  await stampLogo(doc);
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 14) { doc.addPage(); y = 18; }
  };

  doc.setFontSize(16);
  doc.text('Leave History Report', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employeeName ?? 'Employee'}${staffNumber ? ` (${staffNumber})` : ''}`, 14, y);
  y += 5;
  doc.text(`Generated ${new Date().toLocaleString('en-KE')}`, 14, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Balances', 14, y);
  y += 7;
  doc.setFontSize(10);
  if (!allBalances.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('No balances on file.', 14, y);
    y += 7;
  } else {
    for (const b of allBalances) {
      ensureSpace(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`${b.leaveType?.name ?? 'Leave'}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${b.closingBalance} days remaining (accrued ${b.accrued}, used ${b.used})`, 65, y);
      y += 6;
    }
  }
  y += 4;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Request History (${allRequests.length})`, 14, y);
  y += 8;

  if (!allRequests.length) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No leave requests on file.', 14, y);
  } else {
    for (const r of allRequests) {
      ensureSpace(22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${r.leaveType?.name ?? 'Leave'} — ${fmtDate(r.startDate)} to ${fmtDate(r.endDate)} (${r.totalDays}d)`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(r.status.replace('_', ' '), 170, y, { align: 'right' });
      y += 5;
      if (r.reason) { doc.text(`Reason: ${r.reason}`, 18, y, { maxWidth: 175 }); y += 5; }
      if (r.status === 'rejected' && r.rejectionReason) { doc.text(`Rejected: ${r.rejectionReason}`, 18, y, { maxWidth: 175 }); y += 5; }
      if (r.disputeReason) { doc.text(`Disputed: ${r.disputeReason}`, 18, y, { maxWidth: 175 }); y += 5; }
      if (r.revokedAt) { doc.text(`Revoked: ${fmtDate(r.revokedAt)}`, 18, y); y += 5; }
      y += 3;
    }
  }

  return doc.output('datauristring', { filename: `leave-report-${employeeId}.pdf` });
}
