'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/configs/constants';

export function CsvImportButton({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations('Attendance');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('csv', file);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/attendance/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      toast.success(`${res.data.data.successCount} records imported. ${res.data.data.failCount} failed.`);
      onSuccess?.();
    } catch {
      toast.error('Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <Button variant="outline" disabled={loading} onClick={() => ref.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />{loading ? 'Importing...' : t('bulkImport')}
      </Button>
    </>
  );
}
