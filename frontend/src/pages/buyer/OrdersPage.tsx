import { useState } from 'react';
import { PackageCheck, ChevronRight, Clock, CreditCard } from 'lucide-react';
import { useOrders, useConfirmDelivery } from '@/hooks/useOrders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';

export function BuyerOrdersPage() {
  const { data, isLoading } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);
  const confirm = useConfirmDelivery();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 space-y-2 min-w-0">
          {isLoading && [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}

          {data?.data?.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelected(order)}
              className={`w-full text-left bg-white border rounded-xl px-4 py-3 transition-all hover:shadow-sm flex items-center gap-4 ${selected?.id === order.id ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-100'}`}
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <PackageCheck size={16} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                  R{Number(order.deliveredPrice).toFixed(2)} ·{' '}
                  {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}

          {!isLoading && !data?.data?.length && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-medium text-gray-600">No orders yet</p>
              <p className="text-sm mt-1">Browse produce and place your first order</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900 text-sm">{selected.orderNumber}</p>
                <OrderStatusBadge status={selected.status} />
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="flex-1 text-gray-700">{item.listing?.product?.name ?? 'Produce'}</span>
                    <span className="text-gray-500 font-medium">{Number(item.quantityKg).toFixed(0)} kg</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-50 pt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={13} />
                  <span>Delivery {new Date(selected.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <CreditCard size={13} />
                  <span>Due {selected.paymentDueDate ? new Date(selected.paymentDueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}</span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-4">
                <div className="flex justify-between font-semibold text-gray-900 text-sm">
                  <span>Total</span>
                  <span className="text-brand-700">R{Number(selected.deliveredPrice).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">incl. logistics · 7-day payment terms</p>
              </div>

              {selected.status === 'OUT_FOR_DELIVERY' && (
                <Button
                  className="w-full mt-4"
                  size="sm"
                  loading={confirm.isPending}
                  onClick={() => confirm.mutate(selected.id)}
                >
                  Confirm Delivery Received
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
