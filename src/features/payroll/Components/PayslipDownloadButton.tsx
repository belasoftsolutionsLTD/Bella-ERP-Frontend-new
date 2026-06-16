'use client';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/configs/constants';

export function PayslipDownloadButton({ employeeId, month, year }: { employeeId: string; month: number; year: number }) {
  const t = useTranslations('Payroll');
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  const url = `${API_BASE_URL}/payroll/${employeeId}/${month}/${year}/payslip`;

  const download = async () => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `payslip-${month}-${year}.pdf`;
    a.click();
  };

  return (
    <Button size="sm" variant="outline" onClick={download}>
      <Download className="h-4 w-4 mr-1" />{t('downloadPayslip')}
    </Button>
  );
}
