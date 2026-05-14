import { MapPin, Scale, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onOrder?: (listing: Listing) => void;
}

const GRADE_LABEL: Record<string, string> = { A: 'Grade A', B: 'Grade B', C: 'Grade C' };
const GRADE_BADGE: Record<string, 'green' | 'blue' | 'yellow'> = { A: 'green', B: 'blue', C: 'yellow' };

export function ListingCard({ listing, onOrder }: ListingCardProps) {
  const farmGate = Number(listing.farmGatePrice);
  const delivered = +(farmGate * 1.08 + 4.5).toFixed(2);
  const marketPrice = 22;
  const saving = Math.max(0, Math.round((1 - delivered / marketPrice) * 100));
  const gradeKey = listing.grade?.grade ?? 'B';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Photo */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {listing.photos[0] ? (
          <img
            src={listing.photos[0].url}
            alt={listing.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🌱</div>
        )}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant={GRADE_BADGE[gradeKey] ?? 'gray'}>
            {GRADE_LABEL[gradeKey] ?? gradeKey}
          </Badge>
        </div>
        {saving > 0 && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 bg-brand-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              <TrendingDown size={10} />
              {saving}% below market
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{listing.product.name}</h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin size={11} />
          <span>{listing.farmer.displayName} · {listing.farmer.province.replace('_', ' ')}</span>
        </div>

        {/* Pricing row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Farm gate</p>
            <p className="text-sm font-bold text-gray-700 mt-0.5">R{farmGate.toFixed(2)}<span className="text-xs font-normal">/kg</span></p>
          </div>
          <div className="bg-brand-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-brand-500 uppercase tracking-wide">Delivered</p>
            <p className="text-sm font-bold text-brand-700 mt-0.5">R{delivered.toFixed(2)}<span className="text-xs font-normal">/kg</span></p>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Scale size={12} />
          <span><span className="font-medium text-gray-700">{Number(listing.availableKg).toFixed(0)} kg</span> available · min {Number(listing.minimumOrderKg).toFixed(0)} kg</span>
        </div>

        <div className="mt-auto">
          {onOrder ? (
            <Button className="w-full" size="sm" onClick={() => onOrder(listing)}>
              Place Order
            </Button>
          ) : (
            <div className="h-8" />
          )}
        </div>
      </div>
    </div>
  );
}
