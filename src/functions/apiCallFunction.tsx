'use client';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/configs/constants';

interface ApiCallOptions<T = unknown> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  showToast?: boolean;
  returnResponse?: boolean;
  thenFn?: (data: T) => void;
  catchFn?: (error: unknown) => void;
  finallyFn?: () => void;
}

// Endpoints where a 401 means "these credentials/this code were wrong," never "your
// session expired" — retrying those through the refresh flow would be meaningless
// (there's no session yet to refresh) and risks a loop against /auth/refresh itself.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/mfa/complete'];

// Access tokens are deliberately short-lived (see authFunctions.js) — this is what
// makes that safe to do without logging people out constantly. Concurrent requests
// that 401 around the same moment share one in-flight refresh instead of each firing
// their own.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const storedRefreshToken = sessionStorage.getItem('refreshToken');
    if (!storedRefreshToken) return null;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: storedRefreshToken });
      const newToken: string | undefined = res.data?.data?.token;
      const newRefreshToken: string | undefined = res.data?.data?.refreshToken;
      if (!newToken) return null;
      sessionStorage.setItem('token', newToken);
      if (newRefreshToken) sessionStorage.setItem('refreshToken', newRefreshToken);
      return newToken;
    } catch {
      return null;
    }
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// A session that can't be refreshed is really over — clear it and send the user back
// to login rather than leaving them looking at a page full of failed requests.
const forceLogout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('refreshToken');
  const locale = window.location.pathname.split('/')[1] || 'en';
  window.location.href = `/${locale}/login`;
};

export const apiCallFunction = async <T = unknown>({
  url,
  method = 'GET',
  data,
  params,
  signal,
  showToast = true,
  returnResponse = false,
  thenFn,
  catchFn,
  finallyFn,
}: ApiCallOptions<T>): Promise<T | undefined> => {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => url.includes(p));

  const buildConfig = (): AxiosRequestConfig => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    return {
      url,
      method,
      data,
      params,
      signal,
      headers: {
        ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  try {
    let response: AxiosResponse<T>;
    try {
      response = await axios(buildConfig());
    } catch (err) {
      // One silent retry after a successful refresh — never for the auth endpoints
      // themselves, and never a second time for the same request (a fresh 401 right
      // after a successful refresh means something else is wrong, not an expired token).
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 && !isAuthEndpoint) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await axios(buildConfig());
        } else {
          forceLogout();
          throw err;
        }
      } else {
        throw err;
      }
    }

    const responseData = response.data;

    if (showToast) {
      const msg =
        (responseData as Record<string, unknown>)?.message as string | undefined;
      toast.success(msg || 'Success');
    }

    thenFn?.(responseData);
    return returnResponse ? responseData : undefined;
  } catch (error: unknown) {
    if (axios.isCancel(error)) return;

    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      'Something went wrong';

    if (showToast) toast.error(message);

    catchFn?.(error);
  } finally {
    finallyFn?.();
  }
};
