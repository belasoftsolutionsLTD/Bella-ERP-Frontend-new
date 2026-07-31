import type { LowStockAlert, StockByCategoryRow, ValuationReport } from './types';
import { stampLogo } from '@/functions/getCompanyLogo';

// Same client-side jsPDF + inline data-URI pattern as the Leave module's
// generateLeaveHistoryReport — shown in an in-page iframe modal, never a new tab.
// Unlike that generator, this one takes already-fetched data (the Reports tab already
// holds it via its hooks for the on-screen charts/lists) rather than re-fetching, since
// the whole point is to export exactly what's currently filtered on screen.
export async function generateInventoryReport(params: {
  filterLabel: string;
  lowStock: LowStockAlert[];
  stockByCategory: StockByCategoryRow[];
  valuation: ValuationReport | null;
}): Promise<string> {
  const { filterLabel, lowStock, stockByCategory, valuation } = params;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  await stampLogo(doc);
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 14) { doc.addPage(); y = 18; }
  };

  doc.setFontSize(16);
  doc.text('Inventory Report', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(filterLabel, 14, y);
  y += 5;
  doc.text(`Generated ${new Date().toLocaleString('en-KE')}`, 14, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Low Stock Alerts (${lowStock.length})`, 14, y);
  y += 7;
  doc.setFontSize(10);
  if (!lowStock.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('No items at or below reorder point.', 14, y);
    y += 7;
  } else {
    for (const a of lowStock) {
      ensureSpace(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${a.item?.name ?? a.item?.sku ?? '—'} — ${a.quantity} on hand (reorder point ${a.reorderPoint}) @ ${a.location?.name ?? '—'}`, 14, y);
      y += 5.5;
    }
  }
  y += 4;

  ensureSpace(14);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Stock by Category', 14, y);
  y += 7;
  doc.setFontSize(10);
  if (!stockByCategory.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('No stock on file.', 14, y);
    y += 7;
  } else {
    for (const r of stockByCategory) {
      ensureSpace(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${r.category} — ${r.quantity} units across ${r.itemCount} item(s)`, 14, y);
      y += 5.5;
    }
  }
  y += 4;

  if (valuation) {
    ensureSpace(14);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Valuation — Total ${valuation.total.toLocaleString()}`, 14, y);
    y += 7;
    doc.setFontSize(10);
    for (const r of valuation.byLocation) {
      ensureSpace(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${r.location?.name ?? '—'} — ${r.quantity} units, valued ${r.value.toLocaleString()}`, 14, y);
      y += 5.5;
    }
  }

  return doc.output('datauristring', { filename: 'inventory-report.pdf' });
}
