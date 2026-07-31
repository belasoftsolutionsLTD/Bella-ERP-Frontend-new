import type { TrialBalance } from './Hooks/useReports';
import { stampLogo } from '@/functions/getCompanyLogo';

// Same client-side jsPDF + inline data-URI pattern as Leave's/Inventory's report
// generators — shown in an in-page iframe modal, never a new tab.
export async function generateTrialBalanceReport(trialBalance: TrialBalance): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  await stampLogo(doc);
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;
  const ensureSpace = (needed: number) => { if (y + needed > pageHeight - 14) { doc.addPage(); y = 18; } };

  doc.setFontSize(16);
  doc.text('Trial Balance', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleString('en-KE')}`, 14, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Account', 14, y);
  doc.text('Debit', 140, y, { align: 'right' });
  doc.text('Credit', 190, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  for (const r of trialBalance.rows) {
    if (r.debit === 0 && r.credit === 0) continue;
    ensureSpace(6);
    doc.text(`${r.code} — ${r.name}`, 14, y, { maxWidth: 120 });
    doc.text(r.debit ? r.debit.toLocaleString() : '', 140, y, { align: 'right' });
    doc.text(r.credit ? r.credit.toLocaleString() : '', 190, y, { align: 'right' });
    y += 5.5;
  }
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 14, y);
  doc.text(trialBalance.totalDebit.toLocaleString(), 140, y, { align: 'right' });
  doc.text(trialBalance.totalCredit.toLocaleString(), 190, y, { align: 'right' });

  return doc.output('datauristring', { filename: 'trial-balance.pdf' });
}
