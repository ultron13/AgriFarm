import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LogisticsRoute, Delivery } from '@/types';

export function useRoutes() {
  return useQuery({
    queryKey: ['logistics-routes'],
    queryFn: () => api.get<LogisticsRoute[]>('/logistics/routes'),
  });
}

export function useDeliveries(routeId: string | null, date?: string) {
  const params = date ? `?date=${date}` : '';
  return useQuery({
    queryKey: ['deliveries', routeId, date],
    queryFn: () => api.get<Delivery[]>(`/logistics/routes/${routeId}/deliveries${params}`),
    enabled: !!routeId,
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; [key: string]: unknown }) =>
      api.patch<Delivery>(`/logistics/deliveries/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}
