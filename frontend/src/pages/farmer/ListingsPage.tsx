import { useState } from 'react';
import { Plus, Sprout, Package, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useMyListings } from '@/hooks/useListings';
import { CreateListingModal } from '@/components/listings/CreateListingModal';
import { Button } from '@/components/ui/Button';
import type { ListingStatus } from '@/types';

const STATUS_STYLE: Record<ListingStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ACTIVE:    { label: 'Active',    className: 'bg-green-50 text-green-700',  Icon: CheckCircle2 },
  DRAFT:     { label: 'Draft',     className: 'bg-gray-100 text-gray-500',   Icon: Clock },
  RESERVED:  { label: 'Reserved',  className: 'bg-blue-50 text-blue-700',    Icon: Clock },
  SOLD_OUT:  { label: 'Sold out',  className: 'bg-yellow-50 text-yellow-700',Icon: Package },
  EXPIRED:   { label: 'Expired',   className: 'bg-red-50 text-red-500',      Icon: XCircle },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-50 text-red-500',      Icon: XCircle },
};

export function FarmerListingsPage() {
  const { data, isLoading } = useMyListings();
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const listings = data?.data ?? [];

  const handleSuccess = () => {
    setShowModal(false);
    setSuccessMsg('Listing created and is now live for buyers to browse.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={15} className="mr-1.5" />
          New Listing
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={15} />
          {successMsg}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Listings table */}
      {!isLoading && listings.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3 uppercase tracking-wide">Produce</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Status</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Farm gate</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Available</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Min order</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wide">Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((listing) => {
                const s = STATUS_STYLE[listing.status] ?? STATUS_STYLE.DRAFT;
                const StatusIcon = s.Icon;
                return (
                  <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {listing.photos[0] ? (
                          <img
                            src={listing.photos[0].url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                            <Sprout size={15} className="text-brand-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{listing.product.name}</p>
                          {listing.grade && (
                            <p className="text-xs text-gray-400">Grade {listing.grade.grade}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.className}`}>
                        <StatusIcon size={11} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                      R{Number(listing.farmGatePrice).toFixed(2)}/kg
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-700">
                      {Number(listing.availableKg).toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-500">
                      {Number(listing.minimumOrderKg).toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-400 text-xs">
                      {new Date(listing.availableUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && listings.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout size={24} className="text-brand-600" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No listings yet</p>
          <p className="text-sm text-gray-400 mb-6">Create your first listing to start receiving orders from Gauteng restaurants.</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} className="mr-1.5" />
            Create first listing
          </Button>
        </div>
      )}

      {showModal && (
        <CreateListingModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
