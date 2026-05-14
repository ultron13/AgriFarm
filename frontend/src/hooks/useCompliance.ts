import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VaultDoc } from '@/types';

export function useMyCompliance() {
  return useQuery({
    queryKey: ['compliance', 'mine'],
    queryFn: () => api.get<VaultDoc[]>('/compliance'),
  });
}

export function useComplianceByFarmer(farmerId?: string) {
  return useQuery({
    queryKey: ['compliance', 'farmer', farmerId],
    queryFn: () => api.get<VaultDoc[]>(`/compliance?farmerId=${farmerId}`),
    enabled: !!farmerId,
  });
}

export function useUploadComplianceDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.postForm<VaultDoc>('/compliance/upload', formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance'] }),
  });
}

export function useVerifyDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expiresAt }: { id: string; expiresAt?: string }) =>
      api.patch<VaultDoc>(`/compliance/${id}/verify`, { expiresAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance'] }),
  });
}

export function useRejectDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionNote }: { id: string; rejectionNote: string }) =>
      api.patch<VaultDoc>(`/compliance/${id}/reject`, { rejectionNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance'] }),
  });
}

export function useDeleteDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/compliance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance'] }),
  });
}
