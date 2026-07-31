'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { LogisticsAccessLevel, Vehicle, FleetUtilization, VehicleType } from '../types';

export function useLogisticsAccess() {
  const { data, isLoading } = useSWR<{ level: LogisticsAccessLevel }>(`${API_BASE_URL}/logistics/my-access`, swrFetcher);
  return { level: data?.level ?? null, isLoading };
}

export function useVehicles(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '100');
  const key = `${API_BASE_URL}/logistics/vehicles?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Vehicle>>(key, swrFetcher);

  const createVehicle = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateVehicle = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const archiveVehicle = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });
  const assignDriver = (id: string, driverId: string | null) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles/${id}/driver`, method: 'POST', data: { driverId }, thenFn: () => mutate(),
  });
  const updateStatus = (id: string, status: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles/${id}/status`, method: 'POST', data: { status }, thenFn: () => mutate(),
  });
  const updateLocation = (id: string, currentLocation: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicles/${id}/location`, method: 'POST', data: { currentLocation }, thenFn: () => mutate(),
  });

  return { vehicles: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createVehicle, updateVehicle, archiveVehicle, assignDriver, updateStatus, updateLocation };
}

export function useFleetUtilization() {
  const { data, error, isLoading, mutate } = useSWR<FleetUtilization>(`${API_BASE_URL}/logistics/fleet/utilization`, swrFetcher);
  return { utilization: data ?? null, error, isLoading, mutate };
}

export function useVehicleTypes() {
  const { data, error, isLoading, mutate } = useSWR<VehicleType[]>(`${API_BASE_URL}/logistics/vehicle-types`, swrFetcher);

  const createVehicleType = (name: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicle-types`, method: 'POST', data: { name }, thenFn: () => mutate(),
  });
  const deleteVehicleType = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/vehicle-types/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { vehicleTypes: data ?? [], error, isLoading, mutate, createVehicleType, deleteVehicleType };
}
