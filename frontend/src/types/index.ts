export type UserRole = 'FARMER' | 'BUYER' | 'GOV_BUYER' | 'FIELD_AGENT' | 'LOGISTICS_COORDINATOR' | 'SALES_REP' | 'ADMIN' | 'SUPER_ADMIN';

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
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitType: string;
}

export interface ProduceGrade {
  id: string;
  grade: string;
  description: string;
}

export interface ProductWithGrades extends Product {
  grades: ProduceGrade[];
}

export interface CreateListingInput {
  productId: string;
  gradeId?: string;
  farmGatePrice: number;
  availableKg: number;
  minimumOrderKg: number;
  availableFrom: string;
  availableUntil: string;
}

export interface Farmer {
  id: string;
  displayName: string;
  province: string;
  district: string;
  isSmallholder: boolean;
}

export interface FarmerProfile {
  id: string;
  displayName: string;
  province: string;
  district: string;
  isSmallholder: boolean;
  ficaVerified: boolean;
  organization: { id: string; name: string } | null;
  user: { email: string; phone: string | null };
  _count: { listings: number };
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

export interface QualityCheckResult {
  id: string;
  gradeAwarded: QualityGrade;
  quantityKg: number;
  rejectedKg: number;
  notes: string | null;
  performedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  deliveredPrice: number;
  paymentDueDate: string;
  paymentTermDays?: number;
  source: string;
  notes?: string | null;
  items: OrderItem[];
  buyer?: { displayName: string; buyerType?: string };
  delivery?: { status: DeliveryStatus; driverName: string | null; vehicleRef: string | null };
  payment?: { status: PaymentStatus };
  qualityChecks?: QualityCheckResult[];
  createdAt: string;
}

export type QualityGrade = 'A' | 'B' | 'C' | 'REJECTED';

export interface PendingOrderItem {
  id: string;
  quantityKg: number;
  listing: {
    product: { name: string };
    farmer: { id: string; displayName: string; province: string };
  };
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  buyer: { displayName: string };
  items: PendingOrderItem[];
  qualityChecks: { id: string }[];
}

export type DeliveryStatus =
  | 'SCHEDULED' | 'COLLECTED' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface LogisticsRoute {
  id: string;
  name: string;
  corridor: string;
  departureTime: string;
  estimatedHours: number;
  isActive: boolean;
  _count?: { deliveries: number };
}

export interface DeliveryOrderItem {
  id: string;
  quantityKg: number;
  listing: { product: { name: string } };
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  buyer: { displayName: string };
  items: DeliveryOrderItem[];
}

export interface Delivery {
  id: string;
  orderId: string;
  routeId: string | null;
  status: DeliveryStatus;
  vehicleRef: string | null;
  driverName: string | null;
  driverPhone: string | null;
  collectionAt: string | null;
  hubArrivalAt: string | null;
  deliveredAt: string | null;
  trackingUrl: string | null;
  order: DeliveryOrder;
}

// ─── Compliance Vault ────────────────────────────────────────────────────────

export type ComplianceDocType =
  | 'BBBEE_CERTIFICATE' | 'TAX_CLEARANCE' | 'HACCP_CERTIFICATE'
  | 'FOOD_SAFETY_CERT' | 'COMPANY_REGISTRATION' | 'BANK_LETTER';

export type ComplianceDocStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface VaultDoc {
  id: string;
  farmerId: string;
  type: ComplianceDocType;
  label: string;
  fileUrl: string;
  fileKey: string;
  status: ComplianceDocStatus;
  expiresAt: string | null;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedById: string | null;
  rejectionNote: string | null;
  farmer?: { displayName: string; province: string };
}

// ─── Government / B2G ────────────────────────────────────────────────────────

export type TenderStatus = 'OPEN' | 'EVALUATION' | 'AWARDED' | 'CANCELLED';
export type BidStatus = 'SUBMITTED' | 'SHORTLISTED' | 'AWARDED' | 'REJECTED';

export interface ComplianceDoc {
  type: string;
  label: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export interface TenderBid {
  id: string;
  tenderId: string;
  farmerId: string;
  pricePerKg: number;
  quantityKg: number;
  notes: string | null;
  status: BidStatus;
  complianceDocs: ComplianceDoc[];
  submittedAt: string;
  evaluatedAt: string | null;
  farmer: {
    id: string;
    displayName: string;
    province: string;
    district: string;
    isSmallholder: boolean;
    organization: { name: string; bbeeeLevel: number | null } | null;
  };
}

export interface Tender {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  department: string;
  productCategory: string;
  quantityKg: number;
  deliveryDate: string;
  deliveryProvince: string;
  deliveryAddress: string;
  budgetPerKg: number | null;
  status: TenderStatus;
  closingDate: string;
  requiresBbbee: boolean;
  requiresHaccp: boolean;
  requiresTaxClear: boolean;
  awardedBidId: string | null;
  notes: string | null;
  createdAt: string;
  buyer: {
    displayName: string;
    organization: { name: string } | null;
  };
  bids: TenderBid[];
  _count: { bids: number };
}

export interface Payout {
  id: string;
  orderId: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: PayoutStatus;
  scheduledFor: string;
  paidAt: string | null;
  order?: { orderNumber: string; buyer: { displayName: string } };
}
