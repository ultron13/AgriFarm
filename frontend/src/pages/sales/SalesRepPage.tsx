import { useState } from 'react';
import {
  Users, Sprout, CheckCircle2, AlertCircle, Plus, X,
  MapPin, Mail, Phone, Building2, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { useFarmers, useOnboardFarmer } from '@/hooks/useFarmers';
import { Button } from '@/components/ui/Button';
import type { FarmerProfile } from '@/types';

// ── Province config ───────────────────────────────────────────────────────────
const PROVINCES = [
  { value: 'LIMPOPO', label: 'Limpopo' },
  { value: 'MPUMALANGA', label: 'Mpumalanga' },
  { value: 'GAUTENG', label: 'Gauteng' },
  { value: 'NORTH_WEST', label: 'North West' },
  { value: 'FREE_STATE', label: 'Free State' },
  { value: 'KWAZULU_NATAL', label: 'KwaZulu-Natal' },
  { value: 'WESTERN_CAPE', label: 'Western Cape' },
  { value: 'EASTERN_CAPE', label: 'Eastern Cape' },
  { value: 'NORTHERN_CAPE', label: 'Northern Cape' },
];

// ── Onboard modal ─────────────────────────────────────────────────────────────
function OnboardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (name: string) => void }) {
  const onboard = useOnboardFarmer();
  const [form, setForm] = useState({
    displayName: '', email: '', password: '', province: 'LIMPOPO',
    district: '', isSmallholder: false, organizationId: '',
  });

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const errors: Record<string, string> = {};
  if (!form.displayName.trim()) errors.displayName = 'Required';
  if (!form.email.includes('@')) errors.email = 'Valid email required';
  if (form.password.length < 8) errors.password = 'Min 8 characters';
  if (!form.district.trim()) errors.district = 'Required';
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await onboard.mutateAsync({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
        province: form.province,
        district: form.district,
        isSmallholder: form.isSmallholder,
        organizationId: form.organizationId || undefined,
      });
      onSuccess(form.displayName);
    } catch { /* error shown below */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Onboard New Farmer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Farm / Cooperative name *</label>
            <input
              value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              placeholder="e.g. Sithole Family Farm"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName}</p>}
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="farmer@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Temp password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="min 8 chars"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Province + District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Province *</label>
              <select
                value={form.province}
                onChange={(e) => set('province', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {PROVINCES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">District *</label>
              <input
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
                placeholder="e.g. Tzaneen"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
            </div>
          </div>

          {/* Smallholder toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">Smallholder farmer</p>
              <p className="text-xs text-gray-400 mt-0.5">Qualifies for B-BBEE smallholder scoring</p>
            </div>
            <button
              type="button"
              onClick={() => set('isSmallholder', !form.isSmallholder)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isSmallholder ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isSmallholder ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {onboard.error && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={14} />
              {(onboard.error as Error).message}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex gap-3 shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={onboard.isPending} disabled={!isValid} onClick={handleSubmit}>
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Farmer card ───────────────────────────────────────────────────────────────
function FarmerCard({ farmer }: { farmer: FarmerProfile }) {
  const province = PROVINCES.find((p) => p.value === farmer.province)?.label ?? farmer.province;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <Sprout size={18} className="text-brand-600" />
        </div>
        {farmer.ficaVerified ? (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <ShieldCheck size={12} /> FICA ✓
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
            <ShieldAlert size={12} /> FICA pending
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{farmer.displayName}</h3>

      {farmer.isSmallholder && (
        <span className="inline-block text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full mb-2">
          Smallholder
        </span>
      )}

      <div className="space-y-1.5 mt-2 text-xs text-gray-500">
        <p className="flex items-center gap-1.5">
          <MapPin size={11} className="text-gray-300" />
          {farmer.district}, {province}
        </p>
        {farmer.organization && (
          <p className="flex items-center gap-1.5">
            <Building2 size={11} className="text-gray-300" />
            {farmer.organization.name}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Mail size={11} className="text-gray-300" />
          {farmer.user.email}
        </p>
        {farmer.user.phone && (
          <p className="flex items-center gap-1.5">
            <Phone size={11} className="text-gray-300" />
            {farmer.user.phone}
          </p>
        )}
      </div>

      <div className="border-t border-gray-50 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Active listings</span>
          <span className={`text-sm font-bold ${farmer._count.listings > 0 ? 'text-brand-700' : 'text-gray-400'}`}>
            {farmer._count.listings}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function SalesRepPage() {
  const [provinceFilter, setProvinceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useFarmers({ province: provinceFilter });
  const farmers = data?.data ?? [];

  const stats = [
    { label: 'Total farmers', value: farmers.length, Icon: Users, color: 'text-gray-900' },
    { label: 'Active listings', value: farmers.reduce((s, f) => s + f._count.listings, 0), Icon: Sprout, color: 'text-brand-600' },
    { label: 'Smallholders', value: farmers.filter((f) => f.isSmallholder).length, Icon: CheckCircle2, color: 'text-green-600' },
    { label: 'FICA pending', value: farmers.filter((f) => !f.ficaVerified).length, Icon: AlertCircle, color: 'text-yellow-600' },
  ];

  const handleSuccess = (name: string) => {
    setShowModal(false);
    setSuccessMsg(`${name} has been onboarded. They can now log in and create listings.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Farmers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Limpopo–Gauteng corridor farmer portfolio</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={15} className="mr-1.5" />
          Onboard Farmer
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Province filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setProvinceFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!provinceFilter ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          All provinces
        </button>
        {PROVINCES.map((p) => (
          <button
            key={p.value}
            onClick={() => setProvinceFilter(provinceFilter === p.value ? '' : p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${provinceFilter === p.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Farmer grid */}
      {!isLoading && farmers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map((f) => <FarmerCard key={f.id} farmer={f} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && farmers.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-brand-600" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No farmers yet</p>
          <p className="text-sm text-gray-400 mb-6">Onboard your first farmer to get the corridor moving.</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} className="mr-1.5" />
            Onboard first farmer
          </Button>
        </div>
      )}

      {showModal && <OnboardModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </div>
  );
}
