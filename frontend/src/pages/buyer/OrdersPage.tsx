import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from '@/components/orders/OrderCard';

export function BuyerOrdersPage() {
  const { data, isLoading } = useOrders();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {data?.data && (
        <div className="space-y-3">
          {data.data.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
          ))}
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Browse available produce and place your first order</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
