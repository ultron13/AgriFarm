export type UserRole = 'FARMER' | 'BUYER' | 'FIELD_AGENT' | 'LOGISTICS_COORDINATOR' | 'SALES_REP' | 'ADMIN' | 'SUPER_ADMIN';

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'QUALITY_CHECKED' | 'IN_TRANSIT'
  | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DISPUTED' | 'CANCELLED' | 'REFUNDED';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'SOLD_OUT' | 'EXPIRED' | 'SUSPENDED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'OVERDUE' | 'FAILED' | 'REFUNDED';

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface ApiResponse<T> {
  data: T | null;
  meta?: { page: number; perPage: number; total: number };
  error: { code: string; message: string } | null;
}

export interface AuthUser {
  userId: string;
  token: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitType: string;
}

export interface Farmer {
  id: string;
  displayName: string;
  province: string;
  district: string;
  isSmallholder: boolean;
}

export interface Listing {
  id: string;
  farmGatePrice: number;
  availableKg: number;
  minimumOrderKg: number;
  availableFrom: string;
  availableUntil: string;
  status: ListingStatus;
  product: Product;
  farmer: Pick<Farmer, 'displayName' | 'province'>;
  grade?: { grade: string; description: string } | null;
  photos: Array<{ url: string }>;
}

export interface OrderItem {
  id: string;
  quantityKg: number;
  farmGatePrice: number;
  deliveredPrice: number;
  listing: Listing;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  deliveredPrice: number;
  paymentDueDate: string;
  source: string;
  items: OrderItem[];
  payment?: { status: PaymentStatus };
  createdAt: string;
}

export interface Payout {
  id: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: PayoutStatus;
  scheduledFor: string;
  paidAt: string | null;
}
