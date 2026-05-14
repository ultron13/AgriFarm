import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';

export function FarmerListingsPage() {
  const { data, isLoading } = useListings();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Button onClick={() => { /* TODO: open create listing modal */ }}>
          + New Listing
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {data?.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}

      {data?.data?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-500">
          <p className="font-medium">No listings yet</p>
          <p className="text-sm mt-1">Create your first listing to start receiving orders</p>
          <Button className="mt-4" onClick={() => { /* TODO */ }}>Create first listing</Button>
        </div>
      )}
    </div>
  );
}
