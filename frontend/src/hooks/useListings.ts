import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qs } from '@/lib/format';
import type { Listing, CreateListingInput } from '@/types';

interface ListingsQuery {
  productId?: string;
  province?: string;
  minKg?: number;
  page?: number;
}

export function useListings(query: ListingsQuery = {}) {
  return useQuery({
    queryKey: ['listings', query],
    queryFn: () => api.get<Listing[]>(`/listings${qs(query)}`),
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get<Listing[]>('/farmers/me/listings'),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingInput) => api.post<Listing>('/listings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}
