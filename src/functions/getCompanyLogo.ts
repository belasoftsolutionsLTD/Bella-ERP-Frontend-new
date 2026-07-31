import { API_BASE_URL } from '@/configs/constants';

export interface CompanyLogo {
  dataUrl: string;
  format: 'PNG' | 'JPEG' | 'WEBP';
  aspectRatio: number;
}

const FORMAT_BY_MIME: Record<string, CompanyLogo['format']> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WEBP',
};

let cached: CompanyLogo | null | undefined;

// Fetched once per page session and cached in memory for every client-generated report
// PDF (Accounting/Leave/Inventory reportGenerators + the single leave-request PDF) to
// stamp a letterhead logo on the page. The logo is never written to disk here — a fresh
// PDF generation just re-embeds this same in-memory data URI — so nothing accumulates
// even under high report-generation volume; there's nothing to clean up.
export async function getCompanyLogo(): Promise<CompanyLogo | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/public/company-logo`);
    if (!res.ok) { cached = null; return null; }
    const blob = await res.blob();
    const format = FORMAT_BY_MIME[blob.type];
    if (!format) { cached = null; return null; } // SVG/GIF etc. — jsPDF can't embed these directly
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const aspectRatio = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    cached = { dataUrl, format, aspectRatio };
  } catch {
    cached = null;
  }
  return cached;
}

// Draws the logo top-right of the current jsPDF page without disturbing any existing
// title/text positioning below it — every reportGenerator calls this right after
// `new jsPDF()` and otherwise proceeds exactly as before.
export async function stampLogo(doc: import('jspdf').jsPDF): Promise<void> {
  const logo = await getCompanyLogo();
  if (!logo) return;
  const h = 14;
  const w = Math.min(30, h * logo.aspectRatio);
  const pageWidth = doc.internal.pageSize.getWidth();
  try {
    doc.addImage(logo.dataUrl, logo.format, pageWidth - 14 - w, 10, w, h);
  } catch {
    /* corrupt/unsupported image — skip, don't block report generation */
  }
}
