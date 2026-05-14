import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Listing, CreateListingInput } from '@/types';

interface ListingsQuery {
  productId?: string;
  province?: string;
  minKg?: number;
  page?: number;
}

export function useListings(query: ListingsQuery = {}) {
  const params = new URLSearchParams();
  if (query.productId) params.set('productId', query.productId);
  if (query.province) params.set('province', query.province);
  if (query.minKg) params.set('minKg', String(query.minKg));
  if (query.page) params.set('page', String(query.page));

  return useQuery({
    queryKey: ['listings', query],
    queryFn: () => api.get<Listing[]>(`/listings?${params.toString()}`),
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
