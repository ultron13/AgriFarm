import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface InitiateResponse {
  paymentId: string;
  redirectUrl?: string;
  instructions?: string;
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({ orderId, method }: { orderId: string; method: 'INSTANT_EFT' | 'ACCOUNT_TO_ACCOUNT' }) =>
      api.post<InitiateResponse>('/payments/initiate', { orderId, method }),
  });
}

export function useMockCompletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<{ success: boolean }>('/payments/mock-complete', { orderId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUploadListingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, file }: { listingId: string; file: File }) => {
      const form = new FormData();
      form.append('photo', file);
      return api.postForm<{ id: string; url: string }>(`/listings/${listingId}/photos`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteListingPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, photoId }: { listingId: string; photoId: string }) =>
      api.delete(`/listings/${listingId}/photos/${photoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
