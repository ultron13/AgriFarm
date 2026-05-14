import { useState } from 'react';
import {
  PackageCheck, ChevronRight, Clock, Wallet, User,
  Sprout, ClipboardCheck, Truck, CheckCircle2, Filter,
} from 'lucide-react';
import { useOrders, useOrder } from '@/hooks/useOrders';
import { usePayouts } from '@/hooks/usePayouts';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import type { Order, OrderStatus } from '@/types';

const COMMISSION_RATE = 0.05;

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const DELIVERY_STEPS: { status: OrderStatus; label: string; Icon: typeof CheckCircle2 }[] = [
  { status: 'CONFIRMED',      label: 'Order confirmed',    Icon: CheckCircle2 },
  { status: 'QUALITY_CHECKED',label: 'Quality checked',    Icon: ClipboardCheck },
  { status: 'IN_TRANSIT',     label: 'In transit',         Icon: Truck },
  { status: 'OUT_FOR_DELIVERY',label: 'Out for delivery',  Icon: Truck },
  { status: 'DELIVERED',      label: 'Delivered',          Icon: CheckCircle2 },
];

const STATUS_ORDER: OrderStatus[] = ['PENDING', 'CONFIRMED', 'QUALITY_CHECKED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DISPUTED', 'CANCELLED', 'REFUNDED'];

function farmGateTotal(order: Order): number {
  return order.items.reduce((s, i) => s + Number(i.farmGatePrice) * Number(i.quantityKg), 0);
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function FarmerOrderDetail({ orderId, payoutsByOrder, onClose }: {
  orderId: string;
  payoutsByOrder: Record<string, { netAmount: number; status: string; scheduledFor: string }>;
  onClose: () => void;
}) {
  const { data, isLoading } = useOrder(orderId);
  const order = data?.data;
  const payout = order ? payoutsByOrder[order.id] : undefined;

  const gross = order ? farmGateTotal(order) : 0;
  const commission = gross * COMMISSION_RATE;
  const net = gross - commission;

  const currentStepIdx = order
    ? DELIVERY_STEPS.findIndex((s) => s.status === order.status)
    : -1;

  return (
    <div className="w-80 shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-8 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
          </div>
        )}

        {order && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
            </div>

            {/* Buyer */}
            {order.buyer && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={13} className="text-gray-400 shrink-0" />
                <span>{order.buyer.displayName}</span>
              </div>
            )}

            {/* Delivery progress */}
            <div className="space-y-1.5">
              {DELIVERY_STEPS.map((step, i) => {
                const done = currentStepIdx >= i;
                const active = currentStepIdx === i;
                return (
                  <div key={step.status} className={`flex items-center gap-2 text-xs ${done ? 'text-brand-700' : 'text-gray-300'}`}>
                    <step.Icon size={12} strokeWidth={active ? 2.5 : 2} />
                    <span className={active ? 'font-semibold' : ''}>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Items */}
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Your produce</p>
              <div className="space-y-2">
                {order.items.map((item) => {
                  const lineGross = Number(item.farmGatePrice) * Number(item.quantityKg);
                  return (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700">{item.listing?.product?.name ?? 'Produce'}</p>
                        <p className="text-xs text-gray-400">
                          {Number(item.quantityKg).toFixed(0)} kg × R{Number(item.farmGatePrice).toFixed(2)}/kg
                        </p>
                      </div>
                      <span className="text-gray-600 font-medium shrink-0">R{lineGross.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Economics */}
            <div className="border-t border-gray-50 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Gross (farm gate)</span>
                <span>R{gross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Commission (5%)</span>
                <span className="text-red-500">-R{commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-50">
                <span>Net payout</span>
                <span className="text-brand-700">R{net.toFixed(2)}</span>
              </div>
            </div>

            {/* Payout status */}
            <div className="border-t border-gray-50 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Wallet size={13} className="text-gray-400" />
                {payout ? (
                  <span className={`${payout.status === 'PAID' ? 'text-green-600 font-medium' : 'text-amber-600'}`}>
                    {payout.status === 'PAID'
                      ? 'Paid'
                      : `Due ${new Date(payout.scheduledFor).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`}
                  </span>
                ) : (
                  <span className="text-gray-400">Payout scheduled after delivery</span>
                )}
              </div>
            </div>

            {/* Quality check */}
            {order.qualityChecks && order.qualityChecks.length > 0 && (
              <div className="border-t border-gray-50 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Quality Check</p>
                {order.qualityChecks.map((qc) => (
                  <div key={qc.id} className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={13} className="text-brand-500" />
                      <span className="font-medium text-gray-900">Grade {qc.gradeAwarded}</span>
                      <span className="text-xs text-gray-400">{Number(qc.quantityKg).toFixed(0)} kg accepted</span>
                    </div>
                    {Number(qc.rejectedKg) > 0 && (
                      <p className="text-xs text-red-500 ml-5">{Number(qc.rejectedKg).toFixed(0)} kg rejected</p>
                    )}
                    {qc.notes && <p className="text-xs text-gray-500 ml-5">{qc.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Dates */}
            <div className="border-t border-gray-50 pt-4 text-xs text-gray-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <Clock size={11} />
                Delivery {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FarmerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useOrders({ status: statusFilter });
  const { data: payoutsData } = usePayouts();
  const orders = data?.data ?? [];

  const payoutsByOrder: Record<string, { netAmount: number; status: string; scheduledFor: string }> = {};
  payoutsData?.data?.forEach((p) => {
    if ((p as any).orderId) {
      payoutsByOrder[(p as any).orderId] = { netAmount: Number(p.netAmount), status: p.status, scheduledFor: p.scheduledFor };
    }
  });

  const sorted = [...orders].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">Orders placed on your listings</p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />
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

      <div className="flex gap-6">
        {/* Order list */}
        <div className="flex-1 space-y-2 min-w-0">
          {isLoading && [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}

          {!isLoading && sorted.map((order) => {
            const gross = farmGateTotal(order);
            const firstItem = order.items[0];
            const isSelected = selectedId === order.id;
            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(isSelected ? null : order.id)}
                className={`w-full text-left bg-white border rounded-xl px-4 py-3.5 transition-all hover:shadow-sm flex items-center gap-4 ${
                  isSelected ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-100'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <Sprout size={15} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {order.buyer?.displayName ?? 'Buyer'} ·{' '}
                    {firstItem?.listing?.product?.name ?? 'Produce'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''} ·{' '}
                    {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">R{gross.toFixed(2)}</p>
                  <p className="text-[11px] text-gray-400">farm gate</p>
                </div>
                <ChevronRight size={15} className={isSelected ? 'text-brand-400' : 'text-gray-200'} />
              </button>
            );
          })}

          {!isLoading && sorted.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <PackageCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">
                {statusFilter ? 'No orders with this status' : 'No orders yet'}
              </p>
              <p className="text-sm mt-1">
                {statusFilter ? 'Try a different filter' : 'Buyers will appear here once they order from your listings'}
              </p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <FarmerOrderDetail
            orderId={selectedId}
            payoutsByOrder={payoutsByOrder}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
