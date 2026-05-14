import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qs } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

interface OrdersFilter {
  status?: string;
  source?: string;
}

export function useOrders(filter: OrdersFilter = {}) {
  return useQuery({
    queryKey: ['orders', filter],
    queryFn: () => api.get<Order[]>(`/orders${qs(filter)}`),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch<Order>(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useOrder(id: string | null) {
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
