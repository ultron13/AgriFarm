import { useState } from 'react';
import { Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/listings/ListingCard';
import { OrderModal } from '@/components/orders/OrderModal';
import type { Listing } from '@/types';

const PROVINCES = ['LIMPOPO', 'MPUMALANGA', 'GAUTENG', 'KWAZULU_NATAL', 'WESTERN_CAPE', 'EASTERN_CAPE'];

export function BrowsePage() {
  const [province, setProvince] = useState('');
  const [minKg, setMinKg] = useState('');
  const [orderListing, setOrderListing] = useState<Listing | null>(null);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  const { data, isLoading } = useListings({
    province: province || undefined,
    minKg: minKg ? Number(minKg) : undefined,
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Browse Produce</h1>
        <p className="text-gray-500 text-sm mt-1">
          Direct from Limpopo farms · delivered to your kitchen by 14:00
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'Farm gate → delivered', value: '~R16/kg', sub: 'tomatoes (market: R22)' },
          { label: 'Farmer payment', value: '48 hrs', sub: 'vs 21 days at market' },
          { label: 'Active listings', value: String(data?.meta?.total ?? data?.data?.length ?? '—'), sub: 'across Limpopo farms' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-gray-400">
          <SlidersHorizontal size={14} />
          <span className="text-xs font-medium text-gray-500">Filter</span>
        </div>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-400" />
          <input
            type="number"
            placeholder="Min kg"
            value={minKg}
            onChange={(e) => setMinKg(e.target.value)}
            className="w-20 text-sm outline-none"
          />
        </div>
        {(province || minKg) && (
          <button
            onClick={() => { setProvince(''); setMinKg(''); }}
            className="text-xs text-brand-600 hover:text-brand-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data?.data?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onOrder={setOrderListing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-medium text-gray-600">No listings match your filters</p>
          <p className="text-sm mt-1">New stock arrives daily from Limpopo</p>
        </div>
      )}

      {/* Order modal */}
      {orderListing && (
        <OrderModal
          listing={orderListing}
          onClose={() => setOrderListing(null)}
          onSuccess={(num) => { setOrderListing(null); setSuccessOrder(num); }}
        />
      )}

      {/* Success toast */}
      {successOrder && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-4 flex items-start gap-3 max-w-sm">
          <CheckCircle2 size={20} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Order placed!</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {successOrder} · You'll receive WhatsApp confirmation shortly.
            </p>
          </div>
          <button onClick={() => setSuccessOrder(null)} className="text-gray-300 hover:text-gray-500 ml-auto">
            <CheckCircle2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
