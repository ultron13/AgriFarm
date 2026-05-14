import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Payout } from '@/types';

export function usePayouts(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['payouts', status],
    queryFn: () => api.get<Payout[]>(`/payouts${params}`),
  });
}
