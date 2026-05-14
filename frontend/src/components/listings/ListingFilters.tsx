import { Input } from '@/components/ui/Input';

interface Filters {
  province: string;
  minKg: string;
}

interface ListingFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const PROVINCES = ['LIMPOPO', 'MPUMALANGA', 'GAUTENG', 'KWAZULU_NATAL', 'WESTERN_CAPE', 'EASTERN_CAPE', 'NORTHERN_CAPE', 'FREE_STATE', 'NORTH_WEST'];

export function ListingFilters({ filters, onChange }: ListingFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={filters.province}
        onChange={(e) => onChange({ ...filters, province: e.target.value })}
      >
        <option value="">All provinces</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <Input
        type="number"
        placeholder="Min kg"
        className="w-28"
        value={filters.minKg}
        onChange={(e) => onChange({ ...filters, minKg: e.target.value })}
      />
    </div>
  );
}
