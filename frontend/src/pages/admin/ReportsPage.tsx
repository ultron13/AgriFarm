import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

interface GmvReport {
  totalGmv: number;
  totalOrders: number;
  from: string;
  to: string;
}

interface UnitEconomics {
  revenue: number;
  logisticsCost: number;
  netMargin: number;
  orderCount: number;
}

export function ReportsPage() {
  const { data: gmv } = useQuery({ queryKey: ['reports', 'gmv'], queryFn: () => api.get<GmvReport>('/reports/gmv') });
  const { data: ue } = useQuery({ queryKey: ['reports', 'unit-economics'], queryFn: () => api.get<UnitEconomics>('/reports/unit-economics') });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">This Month — GMV</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Total GMV</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">R{Number(gmv?.data?.totalGmv ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Orders Delivered</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{gmv?.data?.totalOrders ?? 0}</p>
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Unit Economics</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Revenue (commissions)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">R{Number(ue?.data?.revenue ?? 0).toFixed(0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Logistics cost</p>
          <p className="text-xl font-bold text-red-600 mt-1">-R{Number(ue?.data?.logisticsCost ?? 0).toFixed(0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Net margin</p>
          <p className={`text-xl font-bold mt-1 ${Number(ue?.data?.netMargin ?? 0) >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
            R{Number(ue?.data?.netMargin ?? 0).toFixed(0)}
          </p>
        </Card>
      </div>
    </div>
  );
}
