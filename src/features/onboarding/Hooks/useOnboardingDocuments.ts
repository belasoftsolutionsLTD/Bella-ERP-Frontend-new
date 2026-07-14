'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OnboardingDocument } from '../types';

export function useOnboardingRecordDocuments(recordId: string | null) {
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!recordId) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/records/${recordId}/documents`, showToast: false,
      thenFn: (r) => setDocuments(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [recordId]);

  useEffect(() => { fetch(); }, [fetch]);

  const verify = (documentId: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/documents/${documentId}/verify`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { documents, loading, refetch: fetch, verify };
}
