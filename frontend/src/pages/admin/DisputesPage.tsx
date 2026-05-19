import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useOrders, useResolveDispute } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';

function disputeReason(notes: string | null | undefined): string {
  if (!notes) return '—';
  const match = notes.match(/\[DISPUTE\] (.+?)(?:\n|$)/);
  return match ? match[1] : '—';
}

function ResolutionForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const [outcome, setOutcome] = useState<'REFUND' | 'RESOLVE'>('RESOLVE');
  const [note, setNote] = useState('');
  const { mutate, isPending, error } = useResolveDispute();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (note.trim().length < 5) return;
    mutate({ orderId: order.id, outcome, note: note.trim() }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={submit} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <div className="flex gap-3">
        <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${outcome === 'RESOLVE' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
          <input type="radio" name="outcome" value="RESOLVE" checked={outcome === 'RESOLVE'} onChange={() => setOutcome('RESOLVE')} className="hidden" />
          <CheckCircle2 size={16} className={outcome === 'RESOLVE' ? 'text-green-600' : 'text-gray-400'} />
          <div>
            <div className="text-sm font-medium text-gray-900">Resolve</div>
            <div className="text-xs text-gray-500">Mark delivered, re-queue payouts</div>
          </div>
        </label>
        <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${outcome === 'REFUND' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
          <input type="radio" name="outcome" value="REFUND" checked={outcome === 'REFUND'} onChange={() => setOutcome('REFUND')} className="hidden" />
          <XCircle size={16} className={outcome === 'REFUND' ? 'text-red-600' : 'text-gray-400'} />
          <div>
            <div className="text-sm font-medium text-gray-900">Refund</div>
            <div className="text-xs text-gray-500">Cancel order, payouts stay cancelled</div>
          </div>
        </label>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Resolution note (min. 5 characters)..."
        rows={2}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />

      {error && <p className="text-xs text-red-600">{(error as Error).message}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button
          type="submit"
          size="sm"
          variant={outcome === 'REFUND' ? 'danger' : 'primary'}
          disabled={isPending || note.trim().length < 5}
        >
          {isPending ? 'Saving…' : outcome === 'REFUND' ? 'Issue Refund' : 'Resolve Dispute'}
        </Button>
      </div>
    </form>
  );
}

function DisputeCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{order.orderNumber}</span>
            {order.buyer && <span className="text-sm text-gray-500">· {order.buyer.displayName}</span>}
          </div>
          <p className="text-sm text-gray-600 mt-0.5 truncate">Reason: {disputeReason(order.notes)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            R{Number(order.deliveredPrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            {' · '}
            Delivery {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <ChevronRight size={16} className={`mt-1 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {order.notes ?? '(no notes)'}
          </div>
          <ResolutionForm order={order} onDone={() => setExpanded(false)} />
        </div>
      )}
    </div>
  );
}

export function DisputesPage() {
  const { data, isLoading } = useOrders({ status: 'DISPUTED' });
  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
        <p className="text-sm text-gray-500 mt-1">
          {orders.length} open dispute{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!orders.length ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-600">No open disputes</p>
          <p className="text-sm mt-1">All disputes have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => <DisputeCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
