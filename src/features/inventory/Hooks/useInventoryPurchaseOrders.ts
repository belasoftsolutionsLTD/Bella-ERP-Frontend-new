'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { PurchaseOrder } from '../types';

export function useInventoryPurchaseOrders(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/inventory/purchase-orders?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<PurchaseOrder>>(key, swrFetcher);

  const createPO = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/purchase-orders`, method: 'POST', data: payload,
    returnResponse: true, thenFn: () => mutate(),
  });

  return { purchaseOrders: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createPO };
}

export function useInventoryPurchaseOrder(id: string | null) {
  const key = id ? `${API_BASE_URL}/inventory/purchase-orders/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<PurchaseOrder>(key, swrFetcher);

  const updatePO = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/purchase-orders/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const sendPO = () => apiCallFunction({
    url: `${API_BASE_URL}/inventory/purchase-orders/${id}/send`, method: 'POST', thenFn: () => mutate(),
  });
  const logInvoice = (payload: { invoiceNumber: string; invoiceAmount?: number; invoiceDueDate?: string }) =>
    apiCallFunction({
      url: `${API_BASE_URL}/inventory/purchase-orders/${id}/invoice`, method: 'POST', data: payload, thenFn: () => mutate(),
    });
  const receivePO = (receipts: { itemId: string; quantityReceived: number; unitCost?: number; lotNumber?: string; expiryDate?: string }[]) =>
    apiCallFunction({
      url: `${API_BASE_URL}/inventory/purchase-orders/${id}/receive`, method: 'POST', data: { receipts }, thenFn: () => mutate(),
    });
  const requestPayment = (payload: { paymentMethod: string; paymentReference?: string; paymentEvidence?: File }) => {
    const fd = new FormData();
    fd.append('paymentMethod', payload.paymentMethod);
    if (payload.paymentReference) fd.append('paymentReference', payload.paymentReference);
    if (payload.paymentEvidence) fd.append('paymentEvidence', payload.paymentEvidence);
    return apiCallFunction({
      url: `${API_BASE_URL}/inventory/purchase-orders/${id}/request-payment`, method: 'POST', data: fd, thenFn: () => mutate(),
    });
  };
  const deletePO = () => apiCallFunction({
    url: `${API_BASE_URL}/inventory/purchase-orders/${id}`, method: 'DELETE',
  });

  return { po: data ?? null, error, isLoading, mutate, updatePO, sendPO, logInvoice, receivePO, requestPayment, deletePO };
}
