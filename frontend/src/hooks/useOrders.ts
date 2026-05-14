import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { items: Array<{ listingId: string; quantityKg: number }>; deliveryDate: string; notes?: string }) =>
      api.post<Order>('/orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post<Order>(`/orders/${orderId}/confirm-delivery`, {}),
    onSuccess: (_data, orderId) => qc.invalidateQueries({ queryKey: ['orders', orderId] }),
  });
}
