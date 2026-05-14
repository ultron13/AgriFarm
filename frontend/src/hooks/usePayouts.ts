import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qs } from '@/lib/format';
import type { Payout } from '@/types';

export function usePayouts(status?: string) {
  return useQuery({
    queryKey: ['payouts', status],
    queryFn: () => api.get<Payout[]>(`/payouts${qs({ status })}`),
  });
}
