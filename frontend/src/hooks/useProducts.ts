import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductWithGrades } from '@/types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<ProductWithGrades[]>('/products'),
    staleTime: 5 * 60 * 1000,
  });
}
