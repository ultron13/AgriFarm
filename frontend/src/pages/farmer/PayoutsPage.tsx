import { useState } from 'react';
import {
  Wallet, Clock, TrendingUp, CheckCircle2, AlertCircle,
  ArrowDownToLine, Filter, PackageCheck,
} from 'lucide-react';
import { usePayouts } from '@/hooks/usePayouts';
import { Badge } from '@/components/ui/Badge';
import type { Payout, PayoutStatus } from '@/types';

const STATUS_BADGE: Record<PayoutStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
  PENDING:    { label: 'Pending',    variant: 'yellow' },
  PROCESSING: { label: 'Processing', variant: 'blue' },
  PAID:       { label: 'Paid',       variant: 'green' },
  FAILED:     { label: 'Failed',     variant: 'red' },
  CANCELLED:  { label: 'Cancelled',  variant: 'gray' },
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
];

function relativeDate(dateStr: string): string {
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function PayoutRow({ payout }: { payout: Payout }) {
  const cfg = STATUS_BADGE[payout.status];
  const isPaid = payout.status === 'PAID';
  const isFailed = payout.status === 'FAILED';

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all ${isFailed ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPaid ? 'bg-green-50' : isFailed ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          {isPaid
            ? <CheckCircle2 size={18} className="text-green-600" />
            : isFailed
            ? <AlertCircle size={18} className="text-red-500" />
            : <Clock size={18} className="text-amber-500" />}
        </div>

        {/* Order context */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {payout.order && (
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                <PackageCheck size={13} className="text-gray-400" />
                {payout.order.orderNumber}
              </span>
            )}
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          {payout.order?.buyer && (
            <p className="text-xs text-gray-400">{payout.order.buyer.displayName}</p>
          )}

          {/* Breakdown */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>Gross <span className="font-medium text-gray-700">R{Number(payout.grossAmount).toFixed(2)}</span></span>
            <span className="text-gray-200">·</span>
            <span>Commission <span className="text-red-500 font-medium">-R{Number(payout.commission).toFixed(2)}</span></span>
          </div>
        </div>

        {/* Amount + date */}
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isPaid ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-brand-700'}`}>
            R{Number(payout.netAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {isPaid && payout.paidAt ? (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
              <ArrowDownToLine size={10} />
              Paid {new Date(payout.paidAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
              <Clock size={10} />
              Due {new Date(payout.scheduledFor).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              <span className="text-gray-300">·</span>
              {relativeDate(payout.scheduledFor)}
            </p>
          )}
        </div>
      </div>

      {/* 48-hr promise bar for pending */}
      {payout.status === 'PENDING' && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={11} className="shrink-0" />
          <span>Transferred to your bank within 48 hours of delivery confirmation via Stitch</span>
        </div>
      )}
      {isFailed && (
        <div className="mt-3 pt-3 border-t border-red-50 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle size={11} className="shrink-0" />
          <span>Transfer failed — contact support or wait for automatic retry</span>
        </div>
      )}
    </div>
  );
}

export function FarmerPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = usePayouts(statusFilter || undefined);
  const { data: allData } = usePayouts();

  const all = allData?.data ?? [];
  const payouts = data?.data ?? [];

  const pendingTotal  = all.filter((p) => ['PENDING', 'PROCESSING'].includes(p.status)).reduce((s, p) => s + Number(p.netAmount), 0);
  const paidTotal     = all.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.netAmount), 0);
  const nextPayout    = all.filter((p) => p.status === 'PENDING').sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];
  const daysUntilNext = nextPayout ? Math.max(0, Math.ceil((new Date(nextPayout.scheduledFor).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-400 mt-0.5">48-hour settlement via Stitch after delivery confirmation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-500" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R{pendingTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {daysUntilNext !== null
              ? daysUntilNext === 0 ? 'Due today' : `Next due in ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`
              : 'No pending payouts'}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total paid</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R{paidTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {all.filter((p) => p.status === 'PAID').length} payment{all.filter((p) => p.status === 'PAID').length !== 1 ? 's' : ''} received
          </p>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-brand-600" />
            <p className="text-xs text-brand-500 uppercase tracking-wide">Payment terms</p>
          </div>
          <p className="text-2xl font-bold text-brand-700">48 hrs</p>
          <p className="text-xs text-brand-400 mt-0.5">after buyer delivery confirmation</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === value
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Payout rows */}
      {!isLoading && payouts.length > 0 && (
        <div className="space-y-3">
          {payouts.map((payout) => <PayoutRow key={payout.id} payout={payout} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && payouts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={24} className="text-brand-600" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">
            {statusFilter ? 'No payouts with this status' : 'No payouts yet'}
          </p>
          <p className="text-sm text-gray-400">
            {statusFilter
              ? 'Try a different filter'
              : 'Payouts are created automatically when a buyer confirms delivery. Funds arrive within 48 hours.'}
          </p>
        </div>
      )}
    </div>
  );
}
