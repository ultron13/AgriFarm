import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PackageCheck, ChevronRight, Clock, CreditCard, Truck,
  CheckCircle2, MapPin, AlertCircle, ShieldCheck, FileText, Loader2, ExternalLink,
} from 'lucide-react';
import { useOrders, useConfirmDelivery } from '@/hooks/useOrders';
import { useInitiatePayment } from '@/hooks/usePayments';
import { useInvoice, invoicePdfUrl } from '@/hooks/useInvoices';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import type { Order, DeliveryStatus } from '@/types';

// Statuses where the buyer can confirm receipt (for demo, includes AT_HUB and IN_TRANSIT)
const CONFIRMABLE: string[] = ['IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'];

const DELIVERY_STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'SCHEDULED',       label: 'Scheduled' },
  { status: 'COLLECTED',       label: 'Collected from farm' },
  { status: 'AT_HUB',          label: 'At logistics hub' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED',        label: 'Delivered' },
];

const STEP_ORDER: DeliveryStatus[] = ['SCHEDULED', 'COLLECTED', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function DeliveryTracker({ delivery }: { delivery: Order['delivery'] }) {
  if (!delivery) return null;
  const currentIdx = STEP_ORDER.indexOf(delivery.status as DeliveryStatus);

  return (
    <div className="space-y-2">
      {DELIVERY_STEPS.map((step, i) => {
        const done = currentIdx >= i;
        const active = currentIdx === i;
        return (
          <div key={step.status} className={`flex items-center gap-2.5 text-xs ${done ? 'text-brand-700' : 'text-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
              done ? 'bg-brand-600 border-brand-600' : 'border-gray-200 bg-white'
            }`}>
              {done && <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />}
            </div>
            <span className={active ? 'font-semibold' : ''}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function InvoiceButton({ orderId }: { orderId: string }) {
  const { data } = useInvoice(orderId);
  const invoice = data?.data;
  if (!invoice) return null;

  if (invoice.status === 'DRAFT') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 size={11} className="animate-spin" />
        Generating invoice…
      </div>
    );
  }

  return (
    <a
      href={invoicePdfUrl(orderId)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
    >
      <FileText size={12} />
      {invoice.invoiceNumber}
      <ExternalLink size={10} />
    </a>
  );
}

function OrderDetail({
  order,
  onConfirmed,
  onClose,
}: {
  order: Order;
  onConfirmed: (orderNumber: string) => void;
  onClose: () => void;
}) {
  const confirm = useConfirmDelivery();
  const initiatePay = useInitiatePayment();
  const canConfirm = CONFIRMABLE.includes(order.status);
  const isDelivered = order.status === 'DELIVERED';
  const canPay = ['PENDING', 'CONFIRMED'].includes(order.status);

  const handlePay = () => {
    initiatePay.mutate({ orderId: order.id, method: 'INSTANT_EFT' }, {
      onSuccess: (res) => {
        if (res.data?.redirectUrl) window.location.href = res.data.redirectUrl;
      },
    });
  };

  const handleConfirm = () => {
    confirm.mutate(order.id, {
      onSuccess: () => onConfirmed(order.orderNumber),
    });
  };

  return (
    <div className="w-80 shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-8 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
            <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              <span className="flex-1 text-gray-700">{item.listing?.product?.name ?? 'Produce'}</span>
              <span className="text-gray-500 font-medium">{Number(item.quantityKg).toFixed(0)} kg</span>
            </div>
          ))}
        </div>

        {/* Delivery tracker */}
        {order.delivery && (
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Delivery</p>
            <DeliveryTracker delivery={order.delivery} />

            {/* Driver info */}
            {(order.delivery.driverName || order.delivery.vehicleRef) && (
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-1 text-xs text-gray-500">
                {order.delivery.driverName && (
                  <div className="flex items-center gap-1.5">
                    <Truck size={11} className="text-gray-400" />
                    <span>{order.delivery.driverName}</span>
                  </div>
                )}
                {order.delivery.vehicleRef && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-gray-400" />
                    <span>{order.delivery.vehicleRef}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dates + payment */}
        <div className="border-t border-gray-50 pt-4 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-gray-400 shrink-0" />
            <span>Delivery {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={13} className="text-gray-400 shrink-0" />
            <span>Due {order.paymentDueDate ? new Date(order.paymentDueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-50 pt-4">
          <div className="flex justify-between font-semibold text-gray-900 text-sm">
            <span>Total</span>
            <span className="text-brand-700">R{Number(order.deliveredPrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">incl. logistics · {order.paymentTermDays ?? 7}-day payment terms</p>
        </div>

        {/* Invoice */}
        <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Invoice</span>
          <InvoiceButton orderId={order.id} />
        </div>

        {/* Pay via EFT */}
        {canPay && (
          <div className="border-t border-gray-50 pt-4 space-y-2">
            <p className="text-xs text-gray-500">Pay now via Instant EFT — powered by Ozow</p>
            <Button
              className="w-full"
              size="sm"
              variant="secondary"
              loading={initiatePay.isPending}
              onClick={handlePay}
            >
              <CreditCard size={14} className="mr-1.5" />
              Pay R{Number(order.deliveredPrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </Button>
            {initiatePay.isError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> Failed — try again
              </p>
            )}
          </div>
        )}

        {/* Confirm receipt */}
        {canConfirm && (
          <div className="border-t border-gray-50 pt-4 space-y-2">
            <p className="text-xs text-gray-500">
              Confirming receipt releases payment to the farmer within 48 hours.
            </p>
            <Button
              className="w-full"
              size="sm"
              loading={confirm.isPending}
              onClick={handleConfirm}
            >
              <ShieldCheck size={14} className="mr-1.5" />
              Confirm Receipt
            </Button>
            {confirm.isError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> Failed — try again
              </p>
            )}
          </div>
        )}

        {isDelivered && (
          <div className="border-t border-gray-50 pt-4 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 size={13} />
            <span>Receipt confirmed · farmer payout in progress</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BuyerOrdersPage() {
  const { data, isLoading, refetch } = useOrders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentResult = searchParams.get('payment');

  // Clear the query param after showing the toast
  const dismissPaymentBanner = () => {
    searchParams.delete('payment');
    setSearchParams(searchParams, { replace: true });
    refetch();
  };

  const orders = data?.data ?? [];
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const handleConfirmed = (orderNumber: string) => {
    setConfirmed(orderNumber);
    refetch();
    setTimeout(() => setConfirmed(null), 6000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h1>
      <p className="text-sm text-gray-400 mb-6">Track and confirm your produce deliveries</p>

      {/* Payment success banner */}
      {paymentResult === 'success' && (
        <div className="mb-5 flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3.5">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Payment received</p>
            <p className="text-xs text-green-600 mt-0.5">Your EFT payment has been processed successfully.</p>
          </div>
          <button onClick={dismissPaymentBanner} className="text-green-400 hover:text-green-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Delivery confirmed toast */}
      {confirmed && (
        <div className="mb-5 flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3.5">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Delivery confirmed — {confirmed}</p>
            <p className="text-xs text-green-600 mt-0.5">Farmer payout scheduled · funds arrive within 48 hours via Stitch</p>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Order list */}
        <div className="flex-1 space-y-2 min-w-0">
          {isLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}

          {!isLoading && orders.map((order) => {
            const isSelected = selectedId === order.id;
            const canConfirm = CONFIRMABLE.includes(order.status);
            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(isSelected ? null : order.id)}
                className={`w-full text-left bg-white border rounded-xl px-4 py-3.5 transition-all hover:shadow-sm flex items-center gap-4 ${
                  isSelected ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  order.status === 'DELIVERED' ? 'bg-green-50' : canConfirm ? 'bg-amber-50' : 'bg-brand-50'
                }`}>
                  {order.status === 'DELIVERED'
                    ? <CheckCircle2 size={16} className="text-green-600" />
                    : <PackageCheck size={16} className={canConfirm ? 'text-amber-600' : 'text-brand-600'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                    {canConfirm && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                        Action needed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                    R{Number(order.deliveredPrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ·{' '}
                    {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <ChevronRight size={15} className={isSelected ? 'text-brand-400' : 'text-gray-200'} />
              </button>
            );
          })}

          {!isLoading && orders.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <PackageCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">No orders yet</p>
              <p className="text-sm mt-1">Browse produce and place your first order</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <OrderDetail
            order={selected}
            onConfirmed={handleConfirmed}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
