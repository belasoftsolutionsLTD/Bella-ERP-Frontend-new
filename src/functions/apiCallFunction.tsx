'use client';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

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
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const config: AxiosRequestConfig = {
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

  try {
    const response: AxiosResponse<T> = await axios(config);
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
