import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FarmerProfile } from '@/types';

interface FarmersFilter {
  province?: string;
}

export function useFarmers(filter: FarmersFilter = {}) {
  const params = new URLSearchParams();
  if (filter.province) params.set('province', filter.province);
  const qs = params.toString();
  return useQuery({
    queryKey: ['farmers', filter],
    queryFn: () => api.get<FarmerProfile[]>(`/farmers${qs ? `?${qs}` : ''}`),
  });
}

export interface OnboardFarmerInput {
  email: string;
  password: string;
  displayName: string;
  province: string;
  district: string;
  isSmallholder: boolean;
  organizationId?: string;
}

export function useOnboardFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardFarmerInput) => api.post<FarmerProfile>('/farmers/onboard', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmers'] }),
  });
}
