import { useState } from 'react';
import {
  Landmark, ChevronRight, Clock, AlertCircle, FileText,
  Users, Award, X, Plus, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTenders, useUpdateBidStatus, useUpdateTenderStatus, useCreateTender } from '@/hooks/useTenders';
import type { TenderBid, TenderStatus, BidStatus } from '@/types';

// ─── Status pills ─────────────────────────────────────────────────────────────
const TENDER_STATUS_STYLE: Record<TenderStatus, string> = {
  OPEN:       'bg-green-100 text-green-700',
  EVALUATION: 'bg-amber-100 text-amber-700',
  AWARDED:    'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-gray-100 text-gray-500',
};

const BID_STATUS_STYLE: Record<BidStatus, string> = {
  SUBMITTED:   'bg-gray-100 text-gray-600',
  SHORTLISTED: 'bg-amber-100 text-amber-700',
  AWARDED:     'bg-green-100 text-green-700',
  REJECTED:    'bg-red-100 text-red-600',
};

function daysUntil(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return d;
}

// ─── New Tender Modal ─────────────────────────────────────────────────────────
function NewTenderModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTender();
  const today = new Date().toISOString().split('T')[0];
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  const [f, setF] = useState({
    title: '', description: '', department: '', productCategory: 'VEGETABLES',
    quantityKg: '', budgetPerKg: '', deliveryProvince: 'GAUTENG',
    deliveryAddress: '', closingDate: in14, deliveryDate: in60,
    requiresBbbee: true, requiresHaccp: false, requiresTaxClear: true, notes: '',
  });

  const handleSubmit = async () => {
    await create.mutateAsync({
      ...f,
      quantityKg: Number(f.quantityKg),
      budgetPerKg: f.budgetPerKg ? Number(f.budgetPerKg) : undefined,
      closingDate: new Date(f.closingDate).toISOString(),
      deliveryDate: new Date(f.deliveryDate).toISOString(),
    });
    onClose();
  };

  const field = (label: string, key: keyof typeof f, type = 'text', extra?: Record<string, unknown>) => (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <input
        type={type}
        value={f[key] as string}
        onChange={e => setF(p => ({ ...p, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        {...extra as React.InputHTMLAttributes<HTMLInputElement>}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Post Government Tender</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          {field('Tender Title *', 'title')}
          {field('Issuing Department *', 'department')}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
            <textarea
              value={f.description}
              onChange={e => setF(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Product Category</label>
              <select value={f.productCategory} onChange={e => setF(p => ({ ...p, productCategory: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="VEGETABLES">Vegetables</option>
                <option value="FRUIT">Fruit</option>
                <option value="MIXED">Mixed Produce</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Delivery Province</label>
              <select value={f.deliveryProvince} onChange={e => setF(p => ({ ...p, deliveryProvince: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {['GAUTENG','LIMPOPO','MPUMALANGA','KWAZULU_NATAL','WESTERN_CAPE','EASTERN_CAPE','NORTHERN_CAPE','FREE_STATE','NORTH_WEST'].map(p => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Total Quantity (kg) *', 'quantityKg', 'number')}
            {field('Budget Ceiling (R/kg)', 'budgetPerKg', 'number')}
          </div>

          {field('Delivery Address *', 'deliveryAddress')}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Closing Date</label>
              <input type="date" value={f.closingDate} min={today} onChange={e => setF(p => ({ ...p, closingDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Delivery Date</label>
              <input type="date" value={f.deliveryDate} min={f.closingDate} onChange={e => setF(p => ({ ...p, deliveryDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Compliance Requirements</label>
            <div className="flex gap-4">
              {[['requiresBbbee', 'B-BBEE Certificate'], ['requiresTaxClear', 'Tax Clearance'], ['requiresHaccp', 'HACCP / ISO 22000']].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={f[key as keyof typeof f] as boolean} onChange={e => setF(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Additional Notes</label>
            <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Preference notes, delivery schedule, etc." />
          </div>

          {create.isError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={13} /> {(create.error as Error).message}</p>}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex gap-3 shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={create.isPending} disabled={!f.title || !f.quantityKg || !f.deliveryAddress} onClick={handleSubmit}>
            Publish Tender
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Bid card in the detail panel ────────────────────────────────────────────
function BidCard({ bid, tenderId, tenderStatus, awardedBidId }: { bid: TenderBid; tenderId: string; tenderStatus: TenderStatus; awardedBidId: string | null }) {
  const updateBid = useUpdateBidStatus();
  const canAct = tenderStatus === 'OPEN' || tenderStatus === 'EVALUATION';

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${bid.status === 'AWARDED' ? 'border-green-200 bg-green-50' : bid.status === 'REJECTED' ? 'border-gray-100 bg-gray-50 opacity-60' : bid.status === 'SHORTLISTED' ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{bid.farmer.displayName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{bid.farmer.district}, {bid.farmer.province.replace('_', ' ')} {bid.farmer.isSmallholder && <span className="ml-1 text-brand-600 font-medium">· Smallholder</span>}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 border border-gray-100">
          <p className="text-gray-400">Price</p>
          <p className="font-bold text-gray-900 mt-0.5">R{Number(bid.pricePerKg).toFixed(2)}/kg</p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-100">
          <p className="text-gray-400">Quantity</p>
          <p className="font-bold text-gray-900 mt-0.5">{Number(bid.quantityKg).toLocaleString()} kg</p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-100">
          <p className="text-gray-400">Total</p>
          <p className="font-bold text-brand-700 mt-0.5">R{(Number(bid.pricePerKg) * Number(bid.quantityKg)).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {bid.notes && <p className="text-xs text-gray-600 italic">"{bid.notes}"</p>}

      {/* Compliance docs */}
      <div className="flex flex-wrap gap-1.5">
        {(bid.complianceDocs as Array<{ type: string; label: string; verified: boolean }>).map((doc, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] bg-white border border-gray-100 rounded-full px-2 py-0.5 text-gray-600">
            {doc.verified ? <ShieldCheck size={9} className="text-green-500" /> : <ShieldAlert size={9} className="text-amber-500" />}
            {doc.label.split(' ').slice(0, 3).join(' ')}
          </span>
        ))}
      </div>

      {bid.farmer.organization && (
        <p className="text-[10px] text-gray-400">
          {bid.farmer.organization.name}
          {bid.farmer.organization.bbeeeLevel && ` · B-BBEE Level ${bid.farmer.organization.bbeeeLevel}`}
        </p>
      )}

      {canAct && bid.status !== 'AWARDED' && bid.status !== 'REJECTED' && (
        <div className="flex gap-2 pt-1">
          {bid.status === 'SUBMITTED' && (
            <Button size="sm" variant="secondary" className="flex-1 text-xs" loading={updateBid.isPending} onClick={() => updateBid.mutate({ tenderId, bidId: bid.id, status: 'SHORTLISTED' })}>
              Shortlist
            </Button>
          )}
          <Button size="sm" variant="secondary" className="flex-1 text-xs text-red-600 border-red-100 hover:bg-red-50" loading={updateBid.isPending} onClick={() => updateBid.mutate({ tenderId, bidId: bid.id, status: 'REJECTED' })}>
            Reject
          </Button>
          <Button size="sm" className="flex-1 text-xs" loading={updateBid.isPending} onClick={() => updateBid.mutate({ tenderId, bidId: bid.id, status: 'AWARDED' })}>
            <Award size={11} className="mr-1" />Award
          </Button>
        </div>
      )}
      {bid.status === 'AWARDED' && awardedBidId === bid.id && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
          <Award size={12} /> Contract Awarded
        </div>
      )}
    </div>
  );
}

// ─── Tender detail panel ──────────────────────────────────────────────────────
function TenderDetail({ tenderId, onClose }: { tenderId: string; onClose: () => void }) {
  const { data } = useTenders();
  const updateStatus = useUpdateTenderStatus();
  const tender = data?.data?.find(t => t.id === tenderId);
  if (!tender) return null;

  const lowestBid = tender.bids.length ? Math.min(...tender.bids.map(b => Number(b.pricePerKg))) : null;

  return (
    <div className="w-96 shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm sticky top-8 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{tender.referenceNumber}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TENDER_STATUS_STYLE[tender.status]}`}>{tender.status}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{tender.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{tender.department}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl leading-none shrink-0 ml-2">×</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Requirement summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-800">{tender.productCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity</span>
              <span className="font-medium text-gray-800">{Number(tender.quantityKg).toLocaleString()} kg</span>
            </div>
            {tender.budgetPerKg && (
              <div className="flex justify-between">
                <span className="text-gray-500">Budget ceiling</span>
                <span className="font-medium text-amber-700">≤ R{Number(tender.budgetPerKg).toFixed(2)}/kg</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span className="font-medium text-gray-800 text-right max-w-[180px] leading-tight">{tender.deliveryProvince.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deliver by</span>
              <span className="font-medium text-gray-800">{new Date(tender.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Closes</span>
              <span className={`font-medium ${daysUntil(tender.closingDate) < 4 ? 'text-red-600' : 'text-gray-800'}`}>
                {daysUntil(tender.closingDate) > 0 ? `in ${daysUntil(tender.closingDate)} days` : 'Closed'}
              </span>
            </div>
          </div>

          {/* Compliance required */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Required compliance</p>
            <div className="flex flex-wrap gap-1.5">
              {tender.requiresBbbee && <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-0.5"><ShieldCheck size={10} /> B-BBEE</span>}
              {tender.requiresTaxClear && <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-0.5"><ShieldCheck size={10} /> Tax Clearance</span>}
              {tender.requiresHaccp && <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5"><ShieldCheck size={10} /> HACCP / ISO 22000</span>}
            </div>
          </div>

          {tender.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-xs text-gray-600 leading-relaxed">{tender.description}</p>
            </div>
          )}

          {tender.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
              <p className="text-xs text-amber-800 leading-relaxed">{tender.notes}</p>
            </div>
          )}

          {/* Bid summary stats */}
          {tender.bids.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-brand-50 rounded-xl p-3 text-center">
                <p className="text-xs text-brand-500">Lowest bid</p>
                <p className="text-lg font-bold text-brand-700 mt-0.5">R{lowestBid?.toFixed(2)}</p>
                <p className="text-[10px] text-brand-400">per kg</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-3 text-center">
                <p className="text-xs text-brand-500">Total submissions</p>
                <p className="text-lg font-bold text-brand-700 mt-0.5">{tender.bids.length}</p>
                <p className="text-[10px] text-brand-400">bids received</p>
              </div>
            </div>
          )}

          {/* Bids */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Bids ({tender.bids.length})
            </p>
            {tender.bids.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No bids submitted yet</p>
            ) : (
              <div className="space-y-3">
                {[...tender.bids].sort((a, b) => Number(a.pricePerKg) - Number(b.pricePerKg)).map(bid => (
                  <BidCard key={bid.id} bid={bid} tenderId={tender.id} tenderStatus={tender.status} awardedBidId={tender.awardedBidId} />
                ))}
              </div>
            )}
          </div>

          {/* Move to evaluation */}
          {tender.status === 'OPEN' && tender.bids.length > 0 && (
            <Button variant="secondary" size="sm" className="w-full" loading={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: tender.id, status: 'EVALUATION' })}>
              Close & Move to Evaluation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function GovPortalPage() {
  const { data, isLoading } = useTenders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const allTenders = data?.data ?? [];
  const filtered = filterStatus === 'ALL' ? allTenders : allTenders.filter(t => t.status === filterStatus);

  const stats = {
    open: allTenders.filter(t => t.status === 'OPEN').length,
    evaluation: allTenders.filter(t => t.status === 'EVALUATION').length,
    awarded: allTenders.filter(t => t.status === 'AWARDED').length,
    totalBids: allTenders.reduce((s, t) => s + t._count.bids, 0),
  };

  return (
    <div>
      {/* Gov header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#007A4D] flex items-center justify-center shrink-0">
            <Landmark size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Government Procurement Portal</h1>
            <p className="text-sm text-gray-400">Tender management · B2G fresh produce procurement · Government of South Africa</p>
          </div>
        </div>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Open Tenders', value: stats.open, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'In Evaluation', value: stats.evaluation, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Awarded', value: stats.awarded, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Bids', value: stats.totalBids, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {['ALL', 'OPEN', 'EVALUATION', 'AWARDED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'ALL' ? 'All Tenders' : s}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} className="mr-1.5" />New Tender
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Tender list */}
        <div className="flex-1 space-y-2 min-w-0">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}

          {!isLoading && filtered.map(tender => {
            const isSelected = selectedId === tender.id;
            const days = daysUntil(tender.closingDate);
            return (
              <button key={tender.id} onClick={() => setSelectedId(isSelected ? null : tender.id)}
                className={`w-full text-left bg-white border rounded-xl px-5 py-4 transition-all hover:shadow-sm flex items-start gap-4 ${isSelected ? 'border-brand-400 ring-1 ring-brand-400' : 'border-gray-100'}`}>
                {/* Status indicator */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${tender.status === 'OPEN' ? 'bg-green-500' : tender.status === 'EVALUATION' ? 'bg-amber-500' : tender.status === 'AWARDED' ? 'bg-blue-500' : 'bg-gray-300'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono text-gray-400">{tender.referenceNumber}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TENDER_STATUS_STYLE[tender.status]}`}>{tender.status}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tender.productCategory}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{tender.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tender.department}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{Number(tender.quantityKg).toLocaleString()} kg</span>
                    {tender.budgetPerKg && <span>≤ R{Number(tender.budgetPerKg).toFixed(2)}/kg</span>}
                    <span>{tender._count.bids} bid{tender._count.bids !== 1 ? 's' : ''}</span>
                    {days > 0 ? (
                      <span className={days < 4 ? 'text-red-500 font-medium' : ''}>
                        closes in {days}d
                      </span>
                    ) : <span className="text-gray-400">closed</span>}
                  </div>
                </div>
                <ChevronRight size={15} className={isSelected ? 'text-brand-400' : 'text-gray-200'} />
              </button>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Landmark size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">No tenders found</p>
              <p className="text-sm mt-1">Post a new tender to start receiving bids from farmers</p>
            </div>
          )}
        </div>

        {selectedId && <TenderDetail tenderId={selectedId} onClose={() => setSelectedId(null)} />}
      </div>

      {showNew && <NewTenderModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
