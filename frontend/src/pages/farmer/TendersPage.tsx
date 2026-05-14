import { useState } from 'react';
import {
  Landmark, Clock, Scale, ShieldCheck, AlertCircle,
  CheckCircle2, ChevronRight, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTenders, useSubmitBid } from '@/hooks/useTenders';
import type { Tender, TenderStatus } from '@/types';

const STATUS_STYLE: Record<TenderStatus, string> = {
  OPEN:       'bg-green-100 text-green-700',
  EVALUATION: 'bg-amber-100 text-amber-700',
  AWARDED:    'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-gray-100 text-gray-500',
};

const DEPT_ICON: Record<string, string> = {
  'Department of Basic Education': '🏫',
  'Department of Health': '🏥',
  'Department of Health — Gauteng': '🏥',
  'Department of Correctional Services': '🔒',
};

const COMPLIANCE_OPTIONS = [
  { type: 'BBBEE_CERTIFICATE',   label: 'B-BBEE Certificate',           required: true  },
  { type: 'TAX_CLEARANCE',       label: 'SARS Tax Clearance',            required: true  },
  { type: 'HACCP_CERTIFICATE',   label: 'HACCP / ISO 22000 Certificate', required: false },
  { type: 'FOOD_SAFETY_CERT',    label: 'Food Safety Certificate',       required: false },
  { type: 'COMPANY_REGISTRATION',label: 'CIPC Registration Certificate', required: false },
];

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ─── Submit Bid Panel ─────────────────────────────────────────────────────────
function BidPanel({ tender, onClose }: { tender: Tender; onClose: () => void }) {
  const submit = useSubmitBid();
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState(String(tender.quantityKg));
  const [notes, setNotes] = useState('');
  const [docs, setDocs] = useState<Set<string>>(new Set(['BBBEE_CERTIFICATE', 'TAX_CLEARANCE']));
  const [submitted, setSubmitted] = useState(false);

  const totalValue = Number(price) * Number(qty);
  const overBudget = tender.budgetPerKg && Number(price) > Number(tender.budgetPerKg);

  const toggleDoc = (type: string) => setDocs(prev => {
    const next = new Set(prev);
    if (next.has(type)) next.delete(type); else next.add(type);
    return next;
  });

  const handleSubmit = async () => {
    const complianceDocs = COMPLIANCE_OPTIONS
      .filter(o => docs.has(o.type))
      .map(o => ({ type: o.type, label: `${o.label} (Mock — verified for demo)` }));

    await submit.mutateAsync({ tenderId: tender.id, pricePerKg: Number(price), quantityKg: Number(qty), notes: notes || undefined, complianceDocs });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-96 shrink-0">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center sticky top-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Bid Submitted!</h3>
          <p className="text-sm text-gray-500 mt-1">{tender.referenceNumber}</p>
          <p className="text-sm text-gray-600 mt-3">Your bid of <strong>R{Number(price).toFixed(2)}/kg</strong> for <strong>{Number(qty).toLocaleString()} kg</strong> has been received by {tender.department}.</p>
          <p className="text-xs text-gray-400 mt-2">You'll be notified if your bid is shortlisted or awarded.</p>
          <Button className="w-full mt-5" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl sticky top-8 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-400">{tender.referenceNumber}</span>
              <p className="font-semibold text-gray-900 text-sm mt-0.5 leading-snug">{tender.title}</p>
              <p className="text-xs text-gray-500">{DEPT_ICON[tender.department] ?? '🏛️'} {tender.department}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl ml-2">×</button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
          {/* Tender snapshot */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Requirement</span><span className="font-medium">{Number(tender.quantityKg).toLocaleString()} kg</span></div>
            {tender.budgetPerKg && <div className="flex justify-between"><span className="text-gray-500">Budget ceiling</span><span className="font-medium text-amber-700">≤ R{Number(tender.budgetPerKg).toFixed(2)}/kg</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Deliver to</span><span className="font-medium text-right max-w-[180px]">{tender.deliveryProvince.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery by</span><span className="font-medium">{new Date(tender.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Closes</span>
              <span className={`font-medium ${daysUntil(tender.closingDate) < 4 ? 'text-red-600' : 'text-gray-800'}`}>
                in {daysUntil(tender.closingDate)} days
              </span>
            </div>
          </div>

          {tender.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-800 leading-relaxed">{tender.notes}</p>
            </div>
          )}

          {/* Bid form */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your Bid</p>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Price per kg (R) *</label>
              <input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4.20" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {overBudget && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />Above budget ceiling — bid may be rejected</p>}
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Quantity you can supply (kg) *</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {price && qty && (
              <div className="bg-brand-50 rounded-lg px-3 py-2 flex justify-between text-sm">
                <span className="text-brand-600">Total contract value</span>
                <span className="font-bold text-brand-700">R{totalValue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Delivery schedule, certifications, capacity notes…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
          </div>

          {/* Compliance documents */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Compliance Documents</p>
            <div className="space-y-2">
              {COMPLIANCE_OPTIONS.map(opt => {
                const isReq = (opt.type === 'BBBEE_CERTIFICATE' && tender.requiresBbbee) || (opt.type === 'TAX_CLEARANCE' && tender.requiresTaxClear) || (opt.type === 'HACCP_CERTIFICATE' && tender.requiresHaccp);
                const checked = docs.has(opt.type);
                return (
                  <label key={opt.type} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-brand-300 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleDoc(opt.type)} disabled={isReq} className="rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{opt.label}</p>
                      <p className="text-[10px] text-gray-400">{isReq ? 'Required for this tender' : 'Optional'}</p>
                    </div>
                    {checked && <ShieldCheck size={14} className="text-green-500 shrink-0" />}
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
              By submitting, you confirm all selected documents are current and available for inspection upon request.
              This is a mock portal — no real documents are uploaded.
            </p>
          </div>

          {submit.isError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={13} />{(submit.error as Error).message}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-gray-50 shrink-0">
          <Button className="w-full" loading={submit.isPending} disabled={!price || !qty || Number(price) <= 0 || Number(qty) <= 0} onClick={handleSubmit}>
            <Award size={14} className="mr-1.5" />Submit Bid
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tender card ──────────────────────────────────────────────────────────────
function TenderCard({ tender, onSelect, isSelected }: { tender: Tender; onSelect: () => void; isSelected: boolean }) {
  const days = daysUntil(tender.closingDate);
  const isClosingSoon = days > 0 && days < 4;

  return (
    <button onClick={onSelect} className={`w-full text-left bg-white border rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${isSelected ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-100'}`}>
      {/* Dept banner */}
      <div className="bg-[#007A4D] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{DEPT_ICON[tender.department] ?? '🏛️'}</span>
          <p className="text-white text-xs font-medium leading-tight truncate max-w-[200px]">{tender.department}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white`}>{tender.productCategory}</span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-mono text-gray-400">{tender.referenceNumber}</span>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mt-0.5">{tender.title}</h3>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[tender.status]}`}>{tender.status}</span>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Quantity</p>
            <p className="text-sm font-bold text-gray-700 mt-0.5">{Number(tender.quantityKg).toLocaleString()} <span className="font-normal text-xs">kg</span></p>
          </div>
          <div className="bg-brand-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-brand-500 uppercase tracking-wide">Budget</p>
            <p className="text-sm font-bold text-brand-700 mt-0.5">
              {tender.budgetPerKg ? `≤ R${Number(tender.budgetPerKg).toFixed(2)}/kg` : 'Open'}
            </p>
          </div>
        </div>

        {/* Delivery + closing */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Scale size={10} /> {tender.deliveryProvince.replace('_', ' ')}</span>
          <span className="flex items-center gap-1">
            <Clock size={10} className={isClosingSoon ? 'text-red-500' : ''} />
            <span className={isClosingSoon ? 'text-red-600 font-semibold' : ''}>
              {days > 0 ? `Closes in ${days}d` : 'Closed'}
            </span>
          </span>
        </div>

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {tender.requiresBbbee && <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-full px-1.5 py-0.5">B-BBEE</span>}
          {tender.requiresTaxClear && <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-full px-1.5 py-0.5">Tax Clearance</span>}
          {tender.requiresHaccp && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-1.5 py-0.5">HACCP</span>}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-gray-400">{tender._count.bids} bid{tender._count.bids !== 1 ? 's' : ''} submitted</span>
          {tender.status === 'OPEN' && (
            <span className="text-xs font-semibold text-brand-600 flex items-center gap-0.5">
              View & Bid <ChevronRight size={12} />
            </span>
          )}
          {tender.status === 'AWARDED' && (
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              <Award size={11} /> Awarded
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FarmerTendersPage() {
  const { data, isLoading } = useTenders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('OPEN');

  const allTenders = data?.data ?? [];
  const filtered = filterStatus === 'ALL' ? allTenders : allTenders.filter(t => t.status === filterStatus);
  const selected = allTenders.find(t => t.id === selectedId) ?? null;

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Government Tenders</h1>
        <p className="text-sm text-gray-400">Open procurement opportunities from South African government departments</p>
      </div>

      {/* Info banner */}
      <div className="mt-4 mb-5 bg-[#007A4D]/5 border border-[#007A4D]/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <Landmark size={16} className="text-[#007A4D] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <strong className="text-[#007A4D]">B2G Procurement</strong> — Government departments post tenders for fresh produce via FarmConnect.
          Submit a competitive bid, attach your compliance documents, and get awarded direct government contracts worth up to R15-18 billion annually.
          Smallholder cooperatives are actively preferred under the National School Nutrition Programme.
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5">
        {['OPEN', 'EVALUATION', 'AWARDED', 'ALL'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'ALL' ? 'All' : s}
            {s !== 'ALL' && <span className="ml-1 opacity-70">({allTenders.filter(t => t.status === s).length})</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tender => (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  isSelected={selectedId === tender.id}
                  onSelect={() => setSelectedId(selectedId === tender.id ? null : tender.id)}
                />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Landmark size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">No {filterStatus.toLowerCase()} tenders</p>
              <p className="text-sm mt-1">Check back soon — new tenders are posted regularly</p>
            </div>
          )}
        </div>

        {/* Bid panel */}
        {selected && selected.status === 'OPEN' && (
          <BidPanel tender={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
