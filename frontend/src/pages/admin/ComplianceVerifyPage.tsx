import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useVerifyDoc, useRejectDoc } from '@/hooks/useCompliance';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { VaultDoc } from '@/types';

const STATUS_BADGE: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' }> = {
  VERIFIED: { label: 'Verified',  variant: 'green'  },
  PENDING:  { label: 'Pending',   variant: 'yellow' },
  REJECTED: { label: 'Rejected',  variant: 'red'    },
  EXPIRED:  { label: 'Expired',   variant: 'red'    },
};

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  VERIFIED: CheckCircle2,
  PENDING:  Clock,
  REJECTED: XCircle,
  EXPIRED:  AlertTriangle,
};

const DOC_LABEL: Record<string, string> = {
  BBBEE_CERTIFICATE:    'B-BBEE Certificate',
  TAX_CLEARANCE:        'Tax Clearance',
  HACCP_CERTIFICATE:    'HACCP / Food Safety',
  FOOD_SAFETY_CERT:     'Food Safety Cert',
  COMPANY_REGISTRATION: 'Company Registration',
  BANK_LETTER:          'Bank Confirmation Letter',
};

function RejectModal({ doc, onClose }: { doc: VaultDoc; onClose: () => void }) {
  const [note, setNote] = useState('');
  const reject = useRejectDoc();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-gray-900 mb-3">Reject Document</h3>
        <p className="text-sm text-gray-500 mb-4">
          Rejecting <strong>{DOC_LABEL[doc.type] ?? doc.type}</strong> for {doc.farmer?.displayName}. Provide a reason so the farmer knows what to fix.
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="e.g. Document is expired, please upload a current certificate."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={note.trim().length < 5}
            loading={reject.isPending}
            onClick={async () => { await reject.mutateAsync({ id: doc.id, rejectionNote: note }); onClose(); }}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ComplianceVerifyPage() {
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<VaultDoc | null>(null);
  const [expiresAt, setExpiresAt] = useState<Record<string, string>>({});
  const verify = useVerifyDoc();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance', 'all', filterStatus],
    queryFn: () => api.get<VaultDoc[]>('/compliance'),
  });

  const docs = (data?.data ?? []).filter(d => filterStatus === 'ALL' || d.status === filterStatus);
  const pending = data?.data?.filter(d => d.status === 'PENDING').length ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review and verify farmer compliance documents</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{pending} pending review</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filterStatus.toLowerCase()} documents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const cfg = STATUS_BADGE[doc.status] ?? STATUS_BADGE.PENDING;
            const Icon = STATUS_ICON[doc.status] ?? Clock;
            return (
              <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    doc.status === 'VERIFIED' ? 'bg-green-100' : doc.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Icon size={16} className={
                      doc.status === 'VERIFIED' ? 'text-green-600' : doc.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                    } />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{DOC_LABEL[doc.type] ?? doc.type}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.farmer?.displayName} · {doc.farmer?.province?.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-ZA')}
                      {doc.expiresAt && ` · Expires ${new Date(doc.expiresAt).toLocaleDateString('en-ZA')}`}
                    </p>
                    {doc.rejectionNote && (
                      <p className="text-xs text-red-600 mt-1">Rejection note: {doc.rejectionNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {doc.fileUrl && !doc.fileUrl.startsWith('mock://') ? (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                        <FileText size={13} />View
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 flex items-center gap-1 italic">
                        <FileText size={13} />mock
                      </span>
                    )}

                    {doc.status === 'PENDING' && (
                      <>
                        <input
                          type="date"
                          value={expiresAt[doc.id] ?? ''}
                          onChange={e => setExpiresAt(p => ({ ...p, [doc.id]: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="border border-gray-200 rounded px-2 py-1 text-xs"
                          placeholder="Expiry"
                          title="Optional expiry date"
                        />
                        <Button
                          size="sm"
                          loading={verify.isPending}
                          onClick={() => verify.mutate({ id: doc.id, expiresAt: expiresAt[doc.id] ? new Date(expiresAt[doc.id]).toISOString() : undefined })}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 size={13} className="mr-1" />Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setRejectTarget(doc)}
                        >
                          <XCircle size={13} className="mr-1" />Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && <RejectModal doc={rejectTarget} onClose={() => setRejectTarget(null)} />}
    </div>
  );
}
