import { useState, useRef } from 'react';
import { ShieldCheck, Upload, CheckCircle2, XCircle, Clock, AlertTriangle, Trash2, FileText, ChevronDown } from 'lucide-react';
import { useMyCompliance, useUploadComplianceDoc, useDeleteDoc } from '@/hooks/useCompliance';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ComplianceDocType, VaultDoc } from '@/types';

const DOC_TYPES: { type: ComplianceDocType; label: string; description: string; required: boolean }[] = [
  { type: 'BBBEE_CERTIFICATE',  label: 'B-BBEE Certificate',      description: 'Broad-Based Black Economic Empowerment level certificate', required: true  },
  { type: 'TAX_CLEARANCE',      label: 'Tax Clearance',           description: 'SARS tax clearance certificate or PIN',                   required: true  },
  { type: 'HACCP_CERTIFICATE',  label: 'HACCP / Food Safety',     description: 'HACCP or ISO 22000 food safety certification',            required: false },
  { type: 'FOOD_SAFETY_CERT',   label: 'Food Safety Cert',        description: 'Additional food safety or GAP certification',             required: false },
  { type: 'COMPANY_REGISTRATION', label: 'Company Registration',  description: 'CIPC company registration certificate',                   required: false },
  { type: 'BANK_LETTER',        label: 'Bank Confirmation Letter', description: 'Bank-stamped letter confirming account details',          required: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: 'green' | 'yellow' | 'red' | 'blue'; Icon: typeof CheckCircle2 }> = {
  VERIFIED: { label: 'Verified',  color: 'green',  Icon: CheckCircle2  },
  PENDING:  { label: 'Pending',   color: 'yellow', Icon: Clock         },
  REJECTED: { label: 'Rejected',  color: 'red',    Icon: XCircle       },
  EXPIRED:  { label: 'Expired',   color: 'red',    Icon: AlertTriangle },
};

function DocRow({ docType, doc }: { docType: typeof DOC_TYPES[0]; doc?: VaultDoc }) {
  const [expanded, setExpanded] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadComplianceDoc();
  const remove = useDeleteDoc();

  const status = doc?.status ?? null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', docType.type);
    fd.append('label', docType.label);
    if (expiresAt) fd.append('expiresAt', new Date(expiresAt).toISOString());
    await upload.mutateAsync(fd);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          status === 'VERIFIED' ? 'bg-green-100' :
          status === 'PENDING'  ? 'bg-yellow-100' :
          status === 'REJECTED' || status === 'EXPIRED' ? 'bg-red-100' :
          'bg-gray-100'
        }`}>
          {cfg ? <cfg.Icon size={16} className={
            status === 'VERIFIED' ? 'text-green-600' :
            status === 'PENDING'  ? 'text-yellow-600' :
            'text-red-600'
          } /> : <FileText size={16} className="text-gray-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{docType.label}</p>
            {docType.required && <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-medium">Required</span>}
            {cfg && <Badge variant={cfg.color}>{cfg.label}</Badge>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{docType.description}</p>
          {doc?.expiresAt && (
            <p className={`text-xs mt-0.5 ${new Date(doc.expiresAt) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
              Expires: {new Date(doc.expiresAt).toLocaleDateString('en-ZA')}
            </p>
          )}
        </div>

        <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
          {doc?.status === 'REJECTED' && doc.rejectionNote && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              <strong>Rejected:</strong> {doc.rejectionNote}
            </div>
          )}

          {doc?.fileUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={14} />
              <span className="truncate flex-1">{doc.label}</span>
              {doc.fileUrl.startsWith('mock://') ? (
                <span className="text-xs text-gray-400 italic">mock file</span>
              ) : (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs">View</a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Expiry date (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={async e => { const f = e.target.files?.[0]; if (f) await handleUpload(f); }}
            />
            <Button
              size="sm"
              loading={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={13} className="mr-1.5" />
              {doc ? 'Replace file' : 'Upload'}
            </Button>

            {doc && (
              <Button
                size="sm"
                variant="ghost"
                loading={remove.isPending}
                onClick={() => remove.mutate(doc.id)}
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 size={13} className="mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompliancePage() {
  const { data, isLoading } = useMyCompliance();
  const docs = data?.data ?? [];

  const byType = Object.fromEntries(docs.map(d => [d.type, d]));
  const verifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
  const requiredTypes = DOC_TYPES.filter(t => t.required);
  const requiredVerified = requiredTypes.filter(t => byType[t.type]?.status === 'VERIFIED').length;
  const biddingReady = requiredVerified === requiredTypes.length;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Vault</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload and manage your compliance documents for government tender bids.
        </p>
      </div>

      {/* Readiness card */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-4 ${
        biddingReady ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          biddingReady ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          <ShieldCheck size={20} className={biddingReady ? 'text-green-600' : 'text-amber-600'} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${biddingReady ? 'text-green-800' : 'text-amber-800'}`}>
            {biddingReady ? 'Ready to bid on government tenders' : 'Complete required documents to bid'}
          </p>
          <p className={`text-xs mt-0.5 ${biddingReady ? 'text-green-600' : 'text-amber-600'}`}>
            {verifiedCount} of {docs.length} documents verified · {requiredVerified}/{requiredTypes.length} required
          </p>
        </div>
      </div>

      {/* Doc list */}
      {isLoading ? (
        <div className="space-y-3">
          {DOC_TYPES.map(t => <div key={t.type} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {DOC_TYPES.map(dt => (
            <DocRow key={dt.type} docType={dt} doc={byType[dt.type]} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-5 text-center">
        Accepted formats: PDF, JPG, PNG · Max 10 MB per file · Documents are verified by a FarmConnect field agent within 24 hours.
      </p>
    </div>
  );
}
