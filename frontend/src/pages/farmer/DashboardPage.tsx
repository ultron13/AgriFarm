import { Sprout, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { usePayouts } from '@/hooks/usePayouts';
import { Badge } from '@/components/ui/Badge';

export function FarmerDashboardPage() {
  const { data: listingsData } = useListings();
  const { data: payoutsData } = usePayouts();

  const activeListings = listingsData?.data?.filter((l) => l.status === 'ACTIVE') ?? [];
  const pendingPayouts = payoutsData?.data?.filter((p) => p.status === 'PENDING') ?? [];
  const paidPayouts = payoutsData?.data?.filter((p) => p.status === 'PAID') ?? [];

  const pendingTotal = pendingPayouts.reduce((s, p) => s + Number(p.netAmount), 0);
  const paidTotal = paidPayouts.reduce((s, p) => s + Number(p.netAmount), 0);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your supply performance — Limpopo-Gauteng corridor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Sprout, label: 'Active listings', value: String(activeListings.length), color: 'text-brand-600', bg: 'bg-brand-50' },
          { icon: Wallet, label: 'Pending payout', value: `R${pendingTotal.toFixed(2)}`, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'within 48hrs' },
          { icon: TrendingUp, label: 'Total earned', value: `R${paidTotal.toFixed(2)}`, color: 'text-gray-700', bg: 'bg-gray-100' },
          { icon: Clock, label: 'Payment SLA', value: '48 hrs', color: 'text-green-600', bg: 'bg-green-50', sub: 'on track ✓' },
        ].map(({ icon: Icon, label, value, color, bg, sub }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Active listings */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Active Listings</h2>
          <a href="/listings" className="text-xs text-brand-600 hover:text-brand-700">View all →</a>
        </div>
        {activeListings.length ? (
          <div className="divide-y divide-gray-50">
            {activeListings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-3 px-5 py-3">
                {listing.photos[0] && (
                  <img src={listing.photos[0].url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{listing.product.name}</p>
                  <p className="text-xs text-gray-400">
                    {Number(listing.availableKg).toFixed(0)} kg · R{Number(listing.farmGatePrice).toFixed(2)}/kg
                  </p>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Sprout size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No active listings</p>
            <a href="/listings" className="text-xs text-brand-600 hover:text-brand-700 mt-1 block">Create your first listing →</a>
          </div>
        )}
      </div>
    </div>
  );
}
