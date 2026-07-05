import { apiCallFunction } from '@/functions/apiCallFunction';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const swrFetcher = async <T,>(url: string): Promise<T> => {
  const res = await apiCallFunction<ApiEnvelope<T>>({ url, method: 'GET', showToast: false, returnResponse: true });
  return res!.data;
};

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
