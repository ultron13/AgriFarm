import { useState } from 'react';
import { X, ShoppingCart, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePlaceOrder } from '@/hooks/useOrders';
import type { Listing } from '@/types';

interface OrderModalProps {
  listing: Listing;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

export function OrderModal({ listing, onClose, onSuccess }: OrderModalProps) {
  const [qty, setQty] = useState(Number(listing.minimumOrderKg));
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const placeOrder = usePlaceOrder();

  const farmGate = Number(listing.farmGatePrice);
  const pricePerKg = +(farmGate * 1.08 + 4.5).toFixed(2);
  const total = +(pricePerKg * qty).toFixed(2);
  const minQty = Number(listing.minimumOrderKg);
  const maxQty = Number(listing.availableKg);
  const qtyError = qty < minQty ? `Minimum order is ${minQty} kg` : qty > maxQty ? `Only ${maxQty} kg available` : '';

  const handleSubmit = async () => {
    if (qtyError) return;
    try {
      const res = await placeOrder.mutateAsync({
        items: [{ listingId: listing.id, quantityKg: qty }],
        deliveryDate: new Date(deliveryDate).toISOString(),
        notes: notes || undefined,
      });
      if (res.data) onSuccess(res.data.orderNumber);
    } catch {
      // error shown via placeOrder.error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Place Order</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Produce summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {listing.photos[0] && (
              <img src={listing.photos[0].url} alt="" className="w-14 h-14 object-cover rounded-lg" />
            )}
            <div>
              <p className="font-semibold text-sm text-gray-900">{listing.product.name}</p>
              <p className="text-xs text-gray-500">{listing.farmer.displayName} · {listing.farmer.province}</p>
              <p className="text-xs text-brand-700 font-medium mt-0.5">R{pricePerKg.toFixed(2)}/kg delivered</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Quantity (kg)
              <span className="text-gray-400 font-normal ml-1">· min {minQty} kg · max {maxQty} kg</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(Math.max(minQty, qty - 50))}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex items-center justify-center"
              >−</button>
              <input
                type="number"
                value={qty}
                min={minQty}
                max={maxQty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="flex-1 text-center border border-gray-200 rounded-lg py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setQty(Math.min(maxQty, qty + 50))}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex items-center justify-center"
              >+</button>
            </div>
            {qtyError && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                <AlertCircle size={12} /> {qtyError}
              </p>
            )}
          </div>

          {/* Delivery date */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} /> Delivery date
            </label>
            <input
              type="date"
              value={deliveryDate}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deliver before 07:00 AM — kitchen prep starts early"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Order summary */}
          <div className="bg-brand-50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{qty} kg × R{pricePerKg.toFixed(2)}/kg</span>
              <span className="font-medium">R{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Market price comparison</span>
              <span className="text-brand-600 font-medium">~{Math.max(0, Math.round((1 - pricePerKg / 22) * 100))}% saving</span>
            </div>
            <div className="border-t border-brand-100 pt-2 mt-2 flex justify-between font-semibold text-gray-900">
              <span>Total (7-day terms)</span>
              <span className="text-brand-700">R{total.toFixed(2)}</span>
            </div>
          </div>

          {placeOrder.error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} /> {(placeOrder.error as Error).message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={placeOrder.isPending}
            disabled={!!qtyError}
            onClick={handleSubmit}
          >
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  );
}
