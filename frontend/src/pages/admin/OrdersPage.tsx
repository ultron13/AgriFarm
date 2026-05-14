import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from '@/components/orders/OrderCard';

export function AdminOrdersPage() {
  const { data, isLoading } = useOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Orders</h1>
      {isLoading && <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>}
      {data?.data && (
        <div className="space-y-3">
          {data.data.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
