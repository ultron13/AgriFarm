import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Tender, TenderBid } from '@/types';

export function useTenders(status?: string) {
  return useQuery({
    queryKey: ['tenders', status],
    queryFn: () => api.get<Tender[]>('/tenders' + (status ? `?status=${status}` : '')),
  });
}

export function useTender(id: string | null) {
  return useQuery({
    queryKey: ['tender', id],
    queryFn: () => api.get<Tender>(`/tenders/${id}`),
    enabled: !!id,
  });
}

export function useCreateTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Tender>('/tenders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenders'] }),
  });
}

export function useUpdateTenderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Tender>(`/tenders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenders'] }),
  });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenderId, ...data }: { tenderId: string; pricePerKg: number; quantityKg: number; notes?: string }) =>
      api.post<TenderBid>(`/tenders/${tenderId}/bids`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tenders'] });
      qc.invalidateQueries({ queryKey: ['tender', vars.tenderId] });
    },
  });
}

export function useUpdateBidStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenderId, bidId, status }: { tenderId: string; bidId: string; status: string }) =>
      api.patch<TenderBid>(`/tenders/${tenderId}/bids/${bidId}`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tenders'] });
      qc.invalidateQueries({ queryKey: ['tender', vars.tenderId] });
    },
  });
}
