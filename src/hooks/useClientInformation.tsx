'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useClientInformation() {
  const { userData, isLoggedIn, authLoading } = useAuth();
  return { userData, isLoggedIn, authLoading };
}
