import { Badge } from '@/components/ui/Badge';
import type { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
  PENDING: { label: 'Pending', variant: 'yellow' },
  CONFIRMED: { label: 'Confirmed', variant: 'blue' },
  QUALITY_CHECKED: { label: 'Quality Checked', variant: 'blue' },
  IN_TRANSIT: { label: 'In Transit', variant: 'blue' },
  AT_HUB: { label: 'At Hub', variant: 'blue' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'blue' },
  DELIVERED: { label: 'Delivered', variant: 'green' },
  DISPUTED: { label: 'Disputed', variant: 'red' },
  CANCELLED: { label: 'Cancelled', variant: 'gray' },
  REFUNDED: { label: 'Refunded', variant: 'gray' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
