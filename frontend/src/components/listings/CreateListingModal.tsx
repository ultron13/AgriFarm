import { useState, useMemo, useRef } from 'react';
import { X, Sprout, TrendingUp, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProducts } from '@/hooks/useProducts';
import { useCreateListing } from '@/hooks/useListings';
import { useUploadListingPhoto } from '@/hooks/usePayments';

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const today = new Date().toISOString().split('T')[0];
const inThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

export function CreateListingModal({ onClose, onSuccess }: CreateListingModalProps) {
  const { data: productsData } = useProducts();
  const products = productsData?.data ?? [];

  const [productId, setProductId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [farmGatePrice, setFarmGatePrice] = useState('');
  const [availableKg, setAvailableKg] = useState('');
  const [minimumOrderKg, setMinimumOrderKg] = useState('50');
  const [availableFrom, setAvailableFrom] = useState(today);
  const [availableUntil, setAvailableUntil] = useState(inThirtyDays);

  const createListing = useCreateListing();
  const uploadPhoto = useUploadListingPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const grades = selectedProduct?.grades ?? [];

  const fgPrice = Number(farmGatePrice);
  const deliveredPrice = fgPrice > 0 ? +(fgPrice * 1.08 + 4.5).toFixed(2) : 0;

  const errors: Record<string, string> = {};
  if (!productId) errors.product = 'Select a product';
  if (!farmGatePrice || fgPrice <= 0) errors.price = 'Enter a valid price';
  if (!availableKg || Number(availableKg) <= 0) errors.kg = 'Enter available quantity';
  if (Number(minimumOrderKg) > Number(availableKg)) errors.minKg = 'Min order cannot exceed available kg';
  if (availableUntil <= availableFrom) errors.until = 'End date must be after start date';

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const listing = await createListing.mutateAsync({
        productId,
        gradeId: gradeId || undefined,
        farmGatePrice: fgPrice,
        availableKg: Number(availableKg),
        minimumOrderKg: Number(minimumOrderKg),
        availableFrom: new Date(availableFrom).toISOString(),
        availableUntil: new Date(availableUntil).toISOString(),
      });
      if (photoFile && listing.data?.id) {
        await uploadPhoto.mutateAsync({ listingId: listing.data.id, file: photoFile });
      }
      onSuccess();
    } catch {
      // error shown via createListing.error / uploadPhoto.error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sprout size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">New Listing</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Product */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Produce *</label>
            <select
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setGradeId(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">Select produce…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.product && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.product}</p>}
          </div>

          {/* Grade */}
          {grades.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Grade <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex gap-2">
                {grades.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGradeId(gradeId === g.id ? '' : g.id)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${gradeId === g.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Grade {g.grade}
                  </button>
                ))}
              </div>
              {gradeId && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {grades.find((g) => g.id === gradeId)?.description}
                </p>
              )}
            </div>
          )}

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Farm gate price (R/kg) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={farmGatePrice}
              onChange={(e) => setFarmGatePrice(e.target.value)}
              placeholder="e.g. 5.50"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {deliveredPrice > 0 && (
              <p className="text-xs text-brand-600 mt-1.5 flex items-center gap-1">
                <TrendingUp size={11} />
                Buyers will see R{deliveredPrice.toFixed(2)}/kg delivered (8% commission + R4.50/kg logistics)
              </p>
            )}
            {errors.price && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.price}</p>}
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Available (kg) *</label>
              <input
                type="number"
                min="1"
                value={availableKg}
                onChange={(e) => setAvailableKg(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.kg && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.kg}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Minimum order (kg)</label>
              <input
                type="number"
                min="1"
                value={minimumOrderKg}
                onChange={(e) => setMinimumOrderKg(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.minKg && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.minKg}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Available from *</label>
              <input
                type="date"
                value={availableFrom}
                min={today}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Available until *</label>
              <input
                type="date"
                value={availableUntil}
                min={availableFrom}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.until && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.until}</p>}
            </div>
          </div>

          {/* Summary preview */}
          {isValid && (
            <div className="bg-brand-50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-medium text-brand-700 mb-2">Listing preview</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{selectedProduct?.name}</span>
                <span className="font-medium text-gray-900">R{fgPrice.toFixed(2)}/kg farm gate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Buyer sees</span>
                <span className="font-medium text-brand-700">R{deliveredPrice.toFixed(2)}/kg delivered</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-brand-100">
                <span>{Number(availableKg).toLocaleString()} kg available</span>
                <span>min {Number(minimumOrderKg).toLocaleString()} kg/order</span>
              </div>
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
              >
                <Camera size={20} />
                <span className="text-xs">Click to add a photo</span>
              </button>
            )}
          </div>

          {(createListing.error || uploadPhoto.error) && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} /> {((createListing.error ?? uploadPhoto.error) as Error).message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex gap-3 shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={createListing.isPending || uploadPhoto.isPending}
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {uploadPhoto.isPending ? 'Uploading photo…' : 'Create Listing'}
          </Button>
        </div>
      </div>
    </div>
  );
}
