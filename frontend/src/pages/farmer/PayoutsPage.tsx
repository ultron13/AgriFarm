import { usePayouts } from '@/hooks/usePayouts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PayoutStatus } from '@/types';

const STATUS_BADGE: Record<PayoutStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
  PENDING: { label: 'Pending', variant: 'yellow' },
  PROCESSING: { label: 'Processing', variant: 'blue' },
  PAID: { label: 'Paid', variant: 'green' },
  FAILED: { label: 'Failed', variant: 'red' },
  CANCELLED: { label: 'Cancelled', variant: 'gray' },
};

export function FarmerPayoutsPage() {
  const { data, isLoading } = usePayouts();

  const totalPaid = data?.data?.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.netAmount), 0) ?? 0;
  const totalPending = data?.data?.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.netAmount), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payouts</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Pending payout</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">R{totalPending.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Within 48hrs of delivery confirmation</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total paid (all time)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">R{totalPaid.toFixed(2)}</p>
        </Card>
      </div>

      {isLoading && <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}

      {data?.data && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((payout) => {
                const cfg = STATUS_BADGE[payout.status];
                return (
                  <tr key={payout.id}>
                    <td className="px-4 py-3 text-gray-500">{new Date(payout.scheduledFor).toLocaleDateString('en-ZA')}</td>
                    <td className="px-4 py-3">R{Number(payout.grossAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-red-600">-R{Number(payout.commission).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700">R{Number(payout.netAmount).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.data.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">No payouts yet</p>
          )}
        </Card>
      )}
    </div>
  );
}
