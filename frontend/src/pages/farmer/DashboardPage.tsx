import { useListings } from '@/hooks/useListings';
import { usePayouts } from '@/hooks/usePayouts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function FarmerDashboardPage() {
  const { data: listingsData } = useListings();
  const { data: payoutsData } = usePayouts('PENDING');

  const activeListings = listingsData?.data?.filter((l) => l.status === 'ACTIVE').length ?? 0;
  const pendingPayouts = payoutsData?.data?.reduce((sum, p) => sum + Number(p.netAmount), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Farmer Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Active Listings</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeListings}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Pending Payouts</p>
          <p className="text-3xl font-bold text-brand-700 mt-1">R{pendingPayouts.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Within 48hrs of delivery</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Payment SLA</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">48hrs</p>
          <Badge variant="green" className="mt-1">On track</Badge>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Your Active Listings</h2>
        {listingsData?.data?.filter((l) => l.status === 'ACTIVE').map((listing) => (
          <div key={listing.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-medium text-sm">{listing.product.name}</p>
              <p className="text-xs text-gray-500">{Number(listing.availableKg).toFixed(0)} kg available · R{Number(listing.farmGatePrice).toFixed(2)}/kg</p>
            </div>
            <Badge variant="green">Active</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
