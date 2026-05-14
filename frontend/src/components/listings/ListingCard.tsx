import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onOrder?: (listing: Listing) => void;
}

export function ListingCard({ listing, onOrder }: ListingCardProps) {
  const deliveredEstimate = Number(listing.farmGatePrice) * 1.24 + 4.5;
  const saving = ((20 - deliveredEstimate) / 20 * 100).toFixed(0);

  return (
    <Card padding="none" className="overflow-hidden">
      {listing.photos[0] && (
        <img src={listing.photos[0].url} alt={listing.product.name} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">{listing.product.name}</p>
            <p className="text-sm text-gray-500">{listing.farmer.displayName} · {listing.farmer.province}</p>
          </div>
          <Badge variant="green">Grade B</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Farm gate</p>
            <p className="font-semibold">R{Number(listing.farmGatePrice).toFixed(2)}/kg</p>
          </div>
          <div>
            <p className="text-gray-500">Est. delivered</p>
            <p className="font-semibold text-brand-700">R{deliveredEstimate.toFixed(2)}/kg</p>
          </div>
          <div>
            <p className="text-gray-500">Available</p>
            <p className="font-medium">{Number(listing.availableKg).toFixed(0)} kg</p>
          </div>
          <div>
            <p className="text-gray-500">Min order</p>
            <p className="font-medium">{Number(listing.minimumOrderKg).toFixed(0)} kg</p>
          </div>
        </div>

        {Number(saving) > 0 && (
          <p className="mt-2 text-xs text-brand-700 font-medium">~{saving}% below market price</p>
        )}

        {onOrder && (
          <Button className="w-full mt-3" onClick={() => onOrder(listing)}>
            Place Order
          </Button>
        )}
      </div>
    </Card>
  );
}
