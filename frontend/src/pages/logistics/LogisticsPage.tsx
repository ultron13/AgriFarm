import { useState } from 'react';
import {
  Truck, MapPin, Clock, User, Phone, CheckCircle2,
  Package, AlertCircle, ChevronRight, Calendar,
} from 'lucide-react';
import { useRoutes, useDeliveries, useUpdateDelivery } from '@/hooks/useLogistics';
import { Button } from '@/components/ui/Button';
import type { Delivery, DeliveryStatus } from '@/types';

const today = new Date().toISOString().split('T')[0];

const STATUS_META: Record<DeliveryStatus, { label: string; color: string; next: DeliveryStatus | null; action: string | null }> = {
  SCHEDULED:        { label: 'Scheduled',        color: 'bg-gray-100 text-gray-600',    next: 'COLLECTED',        action: 'Mark Collected' },
  COLLECTED:        { label: 'Collected',         color: 'bg-blue-50 text-blue-700',    next: 'AT_HUB',           action: 'Mark at Hub' },
  AT_HUB:           { label: 'At Hub',            color: 'bg-purple-50 text-purple-700',next: 'OUT_FOR_DELIVERY', action: 'Out for Delivery' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'bg-yellow-50 text-yellow-700',next: 'DELIVERED',        action: 'Mark Delivered' },
  DELIVERED:        { label: 'Delivered',         color: 'bg-green-50 text-green-700',  next: null,               action: null },
  FAILED:           { label: 'Failed',            color: 'bg-red-50 text-red-600',      next: null,               action: null },
  RETURNED:         { label: 'Returned',          color: 'bg-red-50 text-red-600',      next: null,               action: null },
};

const TIMESTAMP_FIELD: Partial<Record<DeliveryStatus, string>> = {
  COLLECTED: 'collectionAt',
  AT_HUB: 'hubArrivalAt',
  DELIVERED: 'deliveredAt',
};

function DeliveryCard({ delivery, onAdvance, isPending }: { delivery: Delivery; onAdvance: (d: Delivery) => void; isPending: boolean }) {
  const meta = STATUS_META[delivery.status] ?? STATUS_META.SCHEDULED;
  const items = delivery.order.items;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm">{delivery.order.orderNumber}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Package size={11} />
            {delivery.order.buyer.displayName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Calendar size={11} />
            Delivery {new Date(delivery.order.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>

        {meta.action && (
          <Button size="sm" loading={isPending} onClick={() => onAdvance(delivery)}>
            <ChevronRight size={13} />
            {meta.action}
          </Button>
        )}
        {!meta.action && delivery.status === 'DELIVERED' && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle2 size={16} />
            Done
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
            <span className="text-gray-700 flex-1">{item.listing.product.name}</span>
            <span className="text-gray-500 font-medium">{Number(item.quantityKg).toFixed(0)} kg</span>
          </div>
        ))}
      </div>

      {/* Driver + vehicle */}
      {(delivery.driverName || delivery.vehicleRef) && (
        <div className="border-t border-gray-50 pt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {delivery.driverName && (
            <span className="flex items-center gap-1.5">
              <User size={11} />
              {delivery.driverName}
            </span>
          )}
          {delivery.driverPhone && (
            <span className="flex items-center gap-1.5">
              <Phone size={11} />
              {delivery.driverPhone}
            </span>
          )}
          {delivery.vehicleRef && (
            <span className="flex items-center gap-1.5">
              <Truck size={11} />
              {delivery.vehicleRef}
            </span>
          )}
        </div>
      )}

      {/* Timestamps */}
      {(delivery.collectionAt || delivery.hubArrivalAt || delivery.deliveredAt) && (
        <div className="border-t border-gray-50 pt-3 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          {delivery.collectionAt && (
            <span>Collected {new Date(delivery.collectionAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {delivery.hubArrivalAt && (
            <span>At hub {new Date(delivery.hubArrivalAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {delivery.deliveredAt && (
            <span>Delivered {new Date(delivery.deliveredAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogisticsPage() {
  const { data: routesData, isLoading: routesLoading } = useRoutes();
  const routes = routesData?.data ?? [];

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const activeRouteId = selectedRouteId ?? routes[0]?.id ?? null;
  const { data: deliveriesData, isLoading: deliveriesLoading } = useDeliveries(activeRouteId, date);
  const deliveries = deliveriesData?.data ?? [];
  const updateDelivery = useUpdateDelivery();

  const activeRoute = routes.find((r) => r.id === activeRouteId);

  const handleAdvance = async (delivery: Delivery) => {
    const next = STATUS_META[delivery.status]?.next;
    if (!next) return;
    setAdvancingId(delivery.id);
    try {
      const tsField = TIMESTAMP_FIELD[next];
      await updateDelivery.mutateAsync({
        id: delivery.id,
        status: next,
        ...(tsField && { [tsField]: new Date().toISOString() }),
      });
    } finally {
      setAdvancingId(null);
    }
  };

  const statusOrder: DeliveryStatus[] = ['SCHEDULED', 'COLLECTED', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];
  const sorted = [...deliveries].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  const counts = deliveries.reduce<Partial<Record<DeliveryStatus, number>>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
        <p className="text-gray-500 text-sm mt-1">Track and advance deliveries along the N1 corridor</p>
      </div>

      <div className="flex gap-6">
        {/* Routes sidebar */}
        <div className="w-64 shrink-0 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium px-1 mb-3">Active Routes</p>

          {routesLoading && [...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}

          {routes.map((route) => {
            const isActive = route.id === activeRouteId;
            return (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${isActive ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400' : 'border-gray-100 bg-white hover:shadow-sm'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Truck size={14} className={isActive ? 'text-brand-600' : 'text-gray-400'} />
                  <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-brand-700' : 'text-gray-800'}`}>{route.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={10} />{route.departureTime}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} />~{route.estimatedHours}h</span>
                </div>
              </button>
            );
          })}

          {!routesLoading && routes.length === 0 && (
            <p className="text-sm text-gray-400 px-1">No active routes</p>
          )}
        </div>

        {/* Deliveries panel */}
        <div className="flex-1 min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {activeRoute && (
                <p className="font-semibold text-gray-900 text-sm">{activeRoute.name}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {(['SCHEDULED', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'] as DeliveryStatus[]).map((s) => counts[s] ? (
                  <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_META[s].color}`}>
                    {counts[s]} {STATUS_META[s].label}
                  </span>
                ) : null)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Loading */}
          {deliveriesLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {/* Delivery cards */}
          {!deliveriesLoading && sorted.length > 0 && (
            <div className="space-y-3">
              {sorted.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onAdvance={handleAdvance}
                  isPending={advancingId === delivery.id && updateDelivery.isPending}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!deliveriesLoading && sorted.length === 0 && activeRouteId && (
            <div className="text-center py-20 text-gray-400">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-600">{date ? 'No deliveries for this date' : 'No deliveries on this route'}</p>
              <p className="text-sm mt-1">{date ? 'Try a different date or' : 'Check that'} orders have been assigned to this route</p>
            </div>
          )}

          {!activeRouteId && !routesLoading && (
            <div className="text-center py-20 text-gray-400">
              <Truck size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-600">Select a route to view deliveries</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
