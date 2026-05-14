import { Card } from '@/components/ui/Card';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-mono text-gray-500">{order.orderNumber}</p>
          <p className="text-lg font-semibold text-gray-900 mt-0.5">
            R{Number(order.deliveredPrice).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
            Delivery {new Date(order.deliveryDate).toLocaleDateString('en-ZA')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
    </Card>
  );
}
