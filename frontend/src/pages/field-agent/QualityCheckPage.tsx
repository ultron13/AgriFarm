import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck, CheckCircle2, AlertTriangle, Camera, X,
  MapPin, Package, Calendar, ChevronRight, Leaf,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { PendingOrder, QualityGrade } from '@/types';

// ── Grade config ─────────────────────────────────────────────────────────────
const GRADE_META: Record<QualityGrade, { label: string; desc: string; style: string; activeStyle: string }> = {
  A: {
    label: 'Grade A',
    desc: 'Export quality — uniform size, no blemishes, firm',
    style: 'border-gray-200 text-gray-500 hover:border-gray-300',
    activeStyle: 'border-green-500 bg-green-50 text-green-700',
  },
  B: {
    label: 'Grade B',
    desc: 'Restaurant quality — minor surface marks (<5%), uniform size ±15%',
    style: 'border-gray-200 text-gray-500 hover:border-gray-300',
    activeStyle: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  C: {
    label: 'Grade C',
    desc: 'Processing grade — visible blemishes, size variation >15%, food-safe',
    style: 'border-gray-200 text-gray-500 hover:border-gray-300',
    activeStyle: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  },
  REJECTED: {
    label: 'Reject',
    desc: 'Fails food safety — mould, rot, contamination, or unsafe condition',
    style: 'border-gray-200 text-gray-500 hover:border-red-300',
    activeStyle: 'border-red-500 bg-red-50 text-red-700',
  },
};

// ── Hooks ────────────────────────────────────────────────────────────────────
function usePendingOrders() {
  return useQuery({
    queryKey: ['quality-pending'],
    queryFn: () => api.get<PendingOrder[]>('/quality-checks/pending'),
    refetchInterval: 30000,
  });
}

function useSubmitCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orderId: string; farmerId: string; gradeAwarded: QualityGrade;
      quantityKg: number; rejectedKg: number; notes?: string; photos: string[];
    }) => api.post('/quality-checks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quality-pending'] });
    },
  });
}

// ── Photo preview ─────────────────────────────────────────────────────────────
interface PhotoPreview { preview: string; fakeKey: string }

// ── Main component ────────────────────────────────────────────────────────────
export function QualityCheckPage() {
  const { data, isLoading } = usePendingOrders();
  const orders = data?.data ?? [];
  const submitCheck = useSubmitCheck();

  const [selected, setSelected] = useState<PendingOrder | null>(null);
  const [grade, setGrade] = useState<QualityGrade>('B');
  const [quantityKg, setQuantityKg] = useState('');
  const [rejectedKg, setRejectedKg] = useState('0');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const primaryItem = selected?.items[0];
  const farmer = primaryItem?.listing.farmer;
  const totalQty = Number(primaryItem?.quantityKg ?? 0);

  const qtyNum = Number(quantityKg);
  const rejNum = Number(rejectedKg);
  const acceptedKg = Math.max(0, qtyNum - rejNum);
  const canSubmit = selected && quantityKg && qtyNum > 0 && rejNum >= 0 && rejNum <= qtyNum && photos.length >= 3;

  const handleSelect = (order: PendingOrder) => {
    setSelected(order);
    setQuantityKg(String(order.items[0]?.quantityKg ?? ''));
    setRejectedKg('0');
    setNotes('');
    setPhotos([]);
    setGrade('B');
    setSuccess(false);
  };

  const handleAddPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => {
          if (prev.length >= 6) return prev;
          return [...prev, {
            preview: ev.target?.result as string,
            fakeKey: `qc/${selected?.id ?? 'draft'}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
          }];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, [selected]);

  const handleSubmit = async () => {
    if (!selected || !farmer || !canSubmit) return;
    await submitCheck.mutateAsync({
      orderId: selected.id,
      farmerId: farmer.id,
      gradeAwarded: grade,
      quantityKg: qtyNum,
      rejectedKg: rejNum,
      notes: notes || undefined,
      photos: photos.map((p) => p.fakeKey),
    });
    setSuccess(true);
    setSelected(null);
    setPhotos([]);
    setQuantityKg('');
    setRejectedKg('0');
    setNotes('');
  };

  const alreadyChecked = (o: PendingOrder) => o.qualityChecks.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quality Checks</h1>
        <p className="text-gray-500 text-sm mt-1">Inspect produce at collection point — minimum 3 photos per check</p>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={15} />
          Quality check submitted. Order moved to Quality Checked status.
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Pending orders list ──────────────────────────────────────────── */}
        <div className="w-72 shrink-0 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium px-1 mb-3">Pending Inspection</p>

          {isLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}

          {!isLoading && orders.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle2 size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-gray-500">All clear</p>
              <p className="text-xs mt-0.5">No orders awaiting inspection</p>
            </div>
          )}

          {orders.map((order) => {
            const checked = alreadyChecked(order);
            const item = order.items[0];
            const isActive = selected?.id === order.id;
            return (
              <button
                key={order.id}
                onClick={() => !checked && handleSelect(order)}
                disabled={checked}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
                    : checked
                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-default'
                    : 'border-gray-100 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  {checked ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 size={11} /> Checked</span>
                  ) : (
                    <ChevronRight size={14} className="text-gray-300" />
                  )}
                </div>
                {item && (
                  <>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Leaf size={10} />
                      {item.listing.product.name} · {Number(item.quantityKg).toFixed(0)} kg
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {item.listing.farmer.displayName}
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={10} />
                  {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Check form ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selected && (
            <div className="flex items-center justify-center h-80 text-center text-gray-400">
              <div>
                <ClipboardCheck size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-500">Select an order to inspect</p>
                <p className="text-sm mt-1">Choose a pending order from the list</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="space-y-5">
              {/* Order context card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{selected.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <Package size={12} /> {selected.buyer.displayName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={11} />
                    Delivery {new Date(selected.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                      <span className="text-gray-700 flex-1">{item.listing.product.name}</span>
                      <span className="text-gray-500">{Number(item.quantityKg).toFixed(0)} kg</span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin size={10} /> {item.listing.farmer.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade selector */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">Grade Awarded</p>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {(Object.keys(GRADE_META) as QualityGrade[]).map((g) => {
                    const m = GRADE_META[g];
                    const isActive = grade === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`border rounded-xl py-3 text-sm font-semibold transition-all ${isActive ? m.activeStyle : m.style}`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">{GRADE_META[grade].desc}</p>
                {grade === 'REJECTED' && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 rounded-xl p-3 text-sm text-red-700">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>Rejected produce will not proceed to delivery. Farmer will be notified.</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">Quantity Inspection</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Received (kg)</label>
                    <input
                      type="number"
                      min="0"
                      max={totalQty * 1.05}
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    />
                    {totalQty > 0 && <p className="text-xs text-gray-400 mt-1">Expected {totalQty} kg</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Rejected (kg)</label>
                    <input
                      type="number"
                      min="0"
                      max={qtyNum}
                      value={rejectedKg}
                      onChange={(e) => setRejectedKg(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="bg-brand-50 rounded-xl px-3 py-2 flex flex-col justify-center">
                    <p className="text-xs text-brand-500 mb-1">Accepted</p>
                    <p className="text-xl font-bold text-brand-700">{acceptedKg.toFixed(0)} kg</p>
                    {qtyNum > 0 && (
                      <p className="text-xs text-brand-400 mt-0.5">{Math.round((acceptedKg / qtyNum) * 100)}% of load</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Photos</p>
                    <p className="text-xs text-gray-400 mt-0.5">Minimum 3 required · capture load, grade marks, any defects</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${photos.length >= 3 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {photos.length} / 3 min
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={p.fakeKey} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}

                  {photos.length < 6 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
                    >
                      <Camera size={20} />
                      <span className="text-xs">Add photo</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleAddPhotos}
                  className="hidden"
                />
              </div>

              {/* Notes */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <label className="text-sm font-semibold text-gray-900 block mb-2">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Minor surface blemishes on ~2% of load, otherwise good"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Validation hint */}
              {!canSubmit && (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {photos.length < 3
                    ? `Add ${3 - photos.length} more photo${3 - photos.length !== 1 ? 's' : ''} before submitting`
                    : !quantityKg || qtyNum <= 0
                    ? 'Enter quantity received'
                    : 'Check quantity values'}
                </p>
              )}

              {submitCheck.error && (
                <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {(submitCheck.error as Error).message}
                </div>
              )}

              <Button
                className="w-full"
                loading={submitCheck.isPending}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                <ClipboardCheck size={15} className="mr-1.5" />
                Submit Quality Check
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
