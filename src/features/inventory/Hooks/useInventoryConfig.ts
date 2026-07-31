'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InventoryAccessLevel, InventoryCategory, InventoryBrand, InventoryUnitOfMeasure, CustomFieldDef, InventoryStaffAccessRow } from '../types';

export function useInventoryAccess() {
  const { data, isLoading } = useSWR<{ level: InventoryAccessLevel }>(`${API_BASE_URL}/inventory/my-access`, swrFetcher);
  return { level: data?.level ?? null, isLoading };
}

export function useInventoryCategories() {
  const key = `${API_BASE_URL}/inventory/categories`;
  const { data, error, isLoading, mutate } = useSWR<InventoryCategory[]>(key, swrFetcher);

  const createCategory = (name: string) => apiCallFunction({
    url: key, method: 'POST', data: { name }, thenFn: () => mutate(),
  });
  const updateCategory = (id: string, payload: Partial<InventoryCategory>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteCategory = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { categories: data ?? [], error, isLoading, mutate, createCategory, updateCategory, deleteCategory };
}

export function useInventoryBrands() {
  const key = `${API_BASE_URL}/inventory/brands`;
  const { data, error, isLoading, mutate } = useSWR<InventoryBrand[]>(key, swrFetcher);

  const createBrand = (name: string) => apiCallFunction({
    url: key, method: 'POST', data: { name }, thenFn: () => mutate(),
  });
  const updateBrand = (id: string, payload: Partial<InventoryBrand>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteBrand = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { brands: data ?? [], error, isLoading, mutate, createBrand, updateBrand, deleteBrand };
}

export function useUnitsOfMeasure() {
  const key = `${API_BASE_URL}/inventory/units-of-measure`;
  const { data, error, isLoading, mutate } = useSWR<InventoryUnitOfMeasure[]>(key, swrFetcher);

  const createUnit = (name: string) => apiCallFunction({
    url: key, method: 'POST', data: { name }, thenFn: () => mutate(),
  });
  const updateUnit = (id: string, payload: Partial<InventoryUnitOfMeasure>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteUnit = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { units: data ?? [], error, isLoading, mutate, createUnit, updateUnit, deleteUnit };
}

export function useCustomFieldDefs() {
  const key = `${API_BASE_URL}/inventory/custom-fields`;
  const { data, error, isLoading, mutate } = useSWR<CustomFieldDef[]>(key, swrFetcher);

  const createDef = (payload: { name: string; fieldType: string; options?: string[] }) => apiCallFunction({
    url: key, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateDef = (id: string, payload: Partial<CustomFieldDef>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteDef = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { fieldDefs: data ?? [], error, isLoading, mutate, createDef, updateDef, deleteDef };
}

export function useInventoryStaffAccess() {
  const key = `${API_BASE_URL}/inventory/staff-access`;
  const { data, error, isLoading, mutate } = useSWR<InventoryStaffAccessRow[]>(key, swrFetcher);

  const setClerkFlag = (userId: string, isInventoryClerk: boolean) => apiCallFunction({
    url: `${key}/${userId}`, method: 'PATCH', data: { isInventoryClerk }, thenFn: () => mutate(),
  });

  return { staff: data ?? [], error, isLoading, mutate, setClerkFlag };
}
