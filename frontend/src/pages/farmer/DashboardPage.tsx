import { Link } from 'react-router-dom';
import {
  Sprout, Wallet, TrendingUp, Scale, PackageCheck,
  Clock, ChevronRight, Plus, ArrowRight,
} from 'lucide-react';
import { useMyListings } from '@/hooks/useListings';
import { usePayouts } from '@/hooks/usePayouts';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { Badge } from '@/components/ui/Badge';
import type { PayoutStatus } from '@/types';

const PAYOUT_BADGE: Record<PayoutStatus, { label: string; variant: 'green' | 'yellow' | 'blue' | 'red' | 'gray' }> = {
  PENDING:    { label: 'Pending',    variant: 'yellow' },
  PROCESSING: { label: 'Processing', variant: 'blue' },
  PAID:       { label: 'Paid',       variant: 'green' },
  FAILED:     { label: 'Failed',     variant: 'red' },
  CANCELLED:  { label: 'Cancelled',  variant: 'gray' },
};

export function FarmerDashboardPage() {
  const { data: listingsData, isLoading: listingsLoading } = useMyListings();
  const { data: payoutsData, isLoading: payoutsLoading } = usePayouts();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();

  const listings = listingsData?.data ?? [];
  const payouts  = payoutsData?.data  ?? [];
  const orders   = ordersData?.data   ?? [];

  const activeListings  = listings.filter((l) => l.status === 'ACTIVE');
  const totalAvailableKg = activeListings.reduce((s, l) => s + Number(l.availableKg), 0);
  const pendingPayouts  = payouts.filter((p) => p.status === 'PENDING');
  const paidPayouts     = payouts.filter((p) => p.status === 'PAID');
  const pendingTotal    = pendingPayouts.reduce((s, p) => s + Number(p.netAmount), 0);
  const earnedTotal     = paidPayouts.reduce((s, p) => s + Number(p.netAmount), 0);
  const nextPayout      = pendingPayouts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Limpopo–Gauteng corridor · your supply at a glance</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            Icon: Sprout, bg: 'bg-brand-50', color: 'text-brand-600',
            label: 'Active listings', value: activeListings.length,
            sub: `${listings.length} total`,
          },
          {
            Icon: Scale, bg: 'bg-blue-50', color: 'text-blue-600',
            label: 'Stock available', value: `${totalAvailableKg.toLocaleString()} kg`,
            sub: 'across active listings',
          },
          {
            Icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-600',
            label: 'Pending payout', value: `R${pendingTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: nextPayout ? `due ${new Date(nextPayout.scheduledFor).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` : 'within 48 hrs',
          },
          {
            Icon: TrendingUp, bg: 'bg-green-50', color: 'text-green-600',
            label: 'Total earned', value: `R${earnedTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: `${paidPayouts.length} paid payout${paidPayouts.length !== 1 ? 's' : ''}`,
          },
        ].map(({ Icon, bg, color, label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide leading-none">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent orders (2/3 width) ──────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck size={15} className="text-brand-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Recent Orders</h2>
              </div>
              <Link to="/orders" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {ordersLoading && (
              <div className="divide-y divide-gray-50">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 mx-5 my-2 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            )}

            {!ordersLoading && recentOrders.length > 0 && (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const firstItem = order.items[0];
                  const totalKg = order.items.reduce((s, i) => s + Number(i.quantityKg), 0);
                  const farmGate = order.items.reduce((s, i) => s + Number(i.farmGatePrice) * Number(i.quantityKg), 0);
                  return (
                    <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <PackageCheck size={13} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.buyer?.displayName ?? 'Buyer'} · {firstItem?.listing?.product?.name ?? 'Produce'} · {totalKg.toFixed(0)} kg
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">R{farmGate.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}</p>
                        <p className="text-xs text-gray-400">{new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!ordersLoading && recentOrders.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <PackageCheck size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-gray-500">No orders yet</p>
                <p className="text-xs mt-0.5">Buyers will appear here once they order from your listings</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (1/3): listings + payouts ─────────────────────── */}
        <div className="space-y-5">
          {/* Active listings */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout size={14} className="text-brand-600" />
                <h2 className="font-semibold text-gray-900 text-sm">My Listings</h2>
              </div>
              <Link to="/listings" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                View all <ChevronRight size={11} />
              </Link>
            </div>

            {listingsLoading && (
              <div className="p-4 space-y-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            )}

            {!listingsLoading && activeListings.length > 0 && (
              <div className="divide-y divide-gray-50">
                {activeListings.slice(0, 4).map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
                    {listing.photos[0] ? (
                      <img src={listing.photos[0].url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <Sprout size={13} className="text-brand-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.product.name}</p>
                      <p className="text-xs text-gray-400">{Number(listing.availableKg).toLocaleString()} kg · R{Number(listing.farmGatePrice).toFixed(2)}/kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!listingsLoading && activeListings.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400">No active listings</p>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-2"
                >
                  <Plus size={11} /> Create listing
                </Link>
              </div>
            )}
          </div>

          {/* Payouts summary */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-brand-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Payouts</h2>
              </div>
              <Link to="/payouts" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                View all <ChevronRight size={11} />
              </Link>
            </div>

            {payoutsLoading && (
              <div className="p-4 space-y-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            )}

            {!payoutsLoading && payouts.length > 0 && (
              <div className="divide-y divide-gray-50">
                {payouts.slice(0, 4).map((payout) => {
                  const cfg = PAYOUT_BADGE[payout.status];
                  return (
                    <div key={payout.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">R{Number(payout.netAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(payout.scheduledFor).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {!payoutsLoading && payouts.length === 0 && (
              <p className="text-sm text-gray-400 text-center p-4">No payouts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
