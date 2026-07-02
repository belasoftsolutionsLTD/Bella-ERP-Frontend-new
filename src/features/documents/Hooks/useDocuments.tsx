'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface HrDocument {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeStaffNo: string;
  department: string;
  docType: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export function useDocuments(docType?: string, search?: string) {
  const [documents, setDocuments] = useState<HrDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (docType) params.set('docType', docType);
    if (search)  params.set('search', search);
    apiCallFunction<{ data: { documents: HrDocument[]; total: number } }>({
      url: `${API_BASE_URL}/hr/documents?${params.toString()}`,
      method: 'GET',
      showToast: false,
      thenFn: (res) => {
        const d = (res as any).data ?? res;
        setDocuments(d.documents ?? []);
        setTotal(d.total ?? 0);
      },
      catchFn: (e: any) => setError(e?.message || 'Failed to load documents'),
      finallyFn: () => setLoading(false),
    });
  }, [docType, search]);

  useEffect(() => { fetch(); }, [fetch]);
  return { documents, total, loading, error, refetch: fetch };
}
