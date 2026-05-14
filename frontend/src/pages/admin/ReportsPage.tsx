import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Package, Percent, Leaf } from 'lucide-react';
import { api } from '@/lib/api';

interface GmvReport { totalGmv: number; totalOrders: number; from: string; to: string; }
interface UnitEcon { revenue: number; logisticsCost: number; netMargin: number; orderCount: number; }
interface BbbeeReport { smallholderPayoutTotal: number; totalPayoutTotal: number; smallholderPct: string; }

export function ReportsPage() {
  const { data: gmv } = useQuery({ queryKey: ['reports', 'gmv'], queryFn: () => api.get<GmvReport>('/reports/gmv') });
  const { data: ue } = useQuery({ queryKey: ['reports', 'unit-economics'], queryFn: () => api.get<UnitEcon>('/reports/unit-economics') });
  const { data: bbbee } = useQuery({ queryKey: ['reports', 'bbbee'], queryFn: () => api.get<BbbeeReport>('/reports/bbbee') });

  const gmvVal = Number(gmv?.data?.totalGmv ?? 0);
  const revenue = Number(ue?.data?.revenue ?? 0);
  const logisticsCost = Number(ue?.data?.logisticsCost ?? 0);
  const netMargin = Number(ue?.data?.netMargin ?? 0);
  const smallPct = Number(bbbee?.data?.smallholderPct ?? 0);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Limpopo-Gauteng corridor · month to date</p>
      </div>

      {/* GMV + Orders */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-brand-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total GMV</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R{gmvVal.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Month to date</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-brand-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">Orders Delivered</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{gmv?.data?.totalOrders ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
      </div>

      {/* Unit economics */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Unit Economics</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Revenue (commissions)', value: revenue, color: 'text-gray-900' },
            { label: 'Logistics cost', value: -logisticsCost, color: 'text-red-500' },
            { label: 'Net margin', value: netMargin, color: netMargin >= 0 ? 'text-brand-700' : 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              <p className={`text-xl font-bold ${color}`}>
                {value < 0 ? '-' : ''}R{Math.abs(value).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        {/* Breakeven progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Corridor breakeven progress</span>
            <span className="font-medium">{Math.min(100, Math.round((gmvVal / 320000) * 100))}% of R320K/month target</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((gmvVal / 320000) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Target: 25-30 restaurants · 54,400 kg/month</p>
        </div>
      </div>

      {/* B-BBEE */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={14} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">B-BBEE Impact</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <Percent size={12} className="text-brand-600" />
              <p className="text-[11px] text-brand-600 uppercase tracking-wide">Smallholder %</p>
            </div>
            <p className="text-2xl font-bold text-brand-700">{smallPct.toFixed(1)}%</p>
            <p className="text-[11px] text-brand-500 mt-0.5">of total payout value</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Smallholder payout</p>
            <p className="text-2xl font-bold text-gray-900">
              R{Number(bbbee?.data?.smallholderPayoutTotal ?? 0).toFixed(0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Total payout</p>
            <p className="text-2xl font-bold text-gray-900">
              R{Number(bbbee?.data?.totalPayoutTotal ?? 0).toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
