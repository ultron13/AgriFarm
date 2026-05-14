import { useState } from 'react';
import {
  Package, TrendingUp, Truck, CheckCircle2, Clock,
  ChevronRight, Filter, CreditCard, User, Sprout, AlertCircle,
} from 'lucide-react';
import { useOrders, useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import type { Order, OrderStatus } from '@/types';

// ── Status filter options ─────────────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Quality Checked', value: 'QUALITY_CHECKED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const SOURCE_LABELS: Record<string, string> = {
  WEB: 'Web', WHATSAPP: 'WhatsApp', FIELD_AGENT: 'Field Agent', API: 'API',
};

const SOURCE_COLORS: Record<string, string> = {
  WEB: 'bg-blue-50 text-blue-700',
  WHATSAPP: 'bg-green-50 text-green-700',
  FIELD_AGENT: 'bg-purple-50 text-purple-700',
  API: 'bg-gray-100 text-gray-600',
};

// ── Admin actions per status ──────────────────────────────────────────────────
const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PENDING:       { label: 'Confirm Order',   next: 'CONFIRMED' },
  CONFIRMED:     { label: 'Mark QC Done',    next: 'QUALITY_CHECKED' },
  QUALITY_CHECKED: { label: 'Mark In Transit', next: 'IN_TRANSIT' },
};

// ── Order detail panel ────────────────────────────────────────────────────────
function OrderDetail({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data, isLoading } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const order = data?.data;
  const nextAction = order ? NEXT_STATUS[order.status] : undefined;

  return (
    <div className="w-96 shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-8 space-y-5">
        {isLoading && <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>}

        {order && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                <div className="flex items-center gap-2 mt-1">
                  <OrderStatusBadge status={order.status} />
                  {order.source && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[order.source] ?? 'bg-gray-100 text-gray-500'}`}>
                      {SOURCE_LABELS[order.source] ?? order.source}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
            </div>

            {/* Buyer */}
            {order.buyer && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={13} className="text-gray-400" />
                <span>{order.buyer.displayName}</span>
                {order.buyer.buyerType && <span className="text-xs text-gray-400">({order.buyer.buyerType.toLowerCase()})</span>}
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    <span className="flex-1 text-gray-700">{item.listing?.product?.name ?? 'Produce'}</span>
                    <span className="text-gray-500">{Number(item.quantityKg).toFixed(0)} kg</span>
                    <span className="text-gray-400 text-xs">R{Number(item.deliveredPrice).toFixed(2)}/kg</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="border-t border-gray-50 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-1.5"><CreditCard size={12} />Payment</span>
                <span className={order.payment?.status === 'PAID' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                  {order.payment?.status ?? 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-1.5"><Clock size={12} />Due</span>
                <span>{order.paymentDueDate ? new Date(order.paymentDueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-50">
                <span>Total</span>
                <span className="text-brand-700">R{Number(order.deliveredPrice).toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery */}
            {order.delivery && (
              <div className="border-t border-gray-50 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Delivery</p>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck size={12} className="text-gray-400" />
                    <span>
                      {String(order.delivery.status).replace(/_/g, ' ')}
                      {order.delivery.vehicleRef && ` · ${order.delivery.vehicleRef}`}
                    </span>
                  </div>
                  {order.delivery.driverName && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <User size={12} className="text-gray-400" />
                      <span>{order.delivery.driverName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="border-t border-gray-50 pt-4 text-xs text-gray-400 space-y-1">
              <p>Created {new Date(order.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
              <p>Delivery {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            </div>

            {/* Admin actions */}
            <div className="border-t border-gray-50 pt-4 space-y-2">
              {nextAction && (
                <Button
                  className="w-full"
                  size="sm"
                  loading={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: order.id, status: nextAction.next })}
                >
                  {nextAction.label}
                </Button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <Button
                  variant="danger"
                  className="w-full"
                  size="sm"
                  loading={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'CANCELLED' })}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useOrders({ status: statusFilter, source: sourceFilter });
  const orders = data?.data ?? [];

  // Stats derived from the unfiltered set — use a separate unfiltered query
  const { data: allData } = useOrders();
  const all = allData?.data ?? [];
  const stats = [
    { label: 'Total orders', value: all.length, Icon: Package, color: 'text-gray-900' },
    { label: 'Pending action', value: all.filter((o) => o.status === 'PENDING').length, Icon: AlertCircle, color: 'text-yellow-600' },
    { label: 'In transit', value: all.filter((o) => ['IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'].includes(o.status)).length, Icon: Truck, color: 'text-blue-600' },
    { label: 'Delivered', value: all.filter((o) => o.status === 'DELIVERED').length, Icon: CheckCircle2, color: 'text-green-600' },
  ];

  const gmv = all.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + Number(o.deliveredPrice), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            GMV delivered: <span className="text-brand-700 font-semibold">R{gmv.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}</span>
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />

        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Orders table */}
        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3 uppercase tracking-wide">Order</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Buyer</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Produce</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Value</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Source</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Delivery</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Status</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order: Order) => {
                    const isSelected = selectedId === order.id;
                    const firstItem = order.items[0];
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedId(isSelected ? null : order.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                              <Package size={12} className="text-gray-400" />
                            </div>
                            <span className="font-medium text-gray-900 text-xs">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <User size={11} className="text-gray-300 shrink-0" />
                            <span className="truncate max-w-[120px]">{order.buyer?.displayName ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Sprout size={11} className="text-gray-300 shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {firstItem?.listing?.product?.name ?? '—'}
                              {order.items.length > 1 && <span className="text-gray-400"> +{order.items.length - 1}</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                          R{Number(order.deliveredPrice).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[order.source] ?? 'bg-gray-100 text-gray-500'}`}>
                            {SOURCE_LABELS[order.source] ?? order.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400">
                          {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="pr-4">
                          <ChevronRight size={14} className={isSelected ? 'text-brand-400' : 'text-gray-200'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && orders.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No orders match this filter</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <OrderDetail orderId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
