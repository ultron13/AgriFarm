import { useState } from 'react';
import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingFilters } from '@/components/listings/ListingFilters';
import type { Listing } from '@/types';

export function BrowsePage() {
  const [filters, setFilters] = useState({ province: '', minKg: '' });
  const { data, isLoading, error } = useListings({
    province: filters.province || undefined,
    minKg: filters.minKg ? Number(filters.minKg) : undefined,
  });

  const handleOrder = (_listing: Listing) => {
    // TODO: open order modal
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Produce</h1>
          <p className="text-gray-500 text-sm mt-0.5">Direct from Limpopo farms — delivered to your kitchen</p>
        </div>
      </div>

      <div className="mb-6">
        <ListingFilters filters={filters} onChange={setFilters} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600">Failed to load listings. Please try again.</div>
      )}

      {data?.data && (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.meta?.total ?? data.data.length} listings available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onOrder={handleOrder} />
            ))}
          </div>
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No listings available</p>
              <p className="text-sm mt-1">Check back tomorrow — new stock arrives daily from Limpopo</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
