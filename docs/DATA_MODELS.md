# Data Models

All models use PostgreSQL via Prisma ORM. UUIDs are used as primary keys throughout. Soft deletes (`deletedAt`) are applied to all tables that store financial or compliance-relevant records.

---

## Entity Relationship Overview

```
Organization ──< Farmer >── ProduceListing ──< OrderItem >── Order ──> Buyer
                               │                                │
                               └──> QualityCheck              └──> Payment
                                                               └──> Delivery
                                                               └──> Invoice
```

---

## Core Entities

### Organization

Represents a farming cooperative or buyer organisation (restaurant group, hotel chain, government department).

```prisma
model Organization {
  id           String   @id @default(uuid())
  name         String
  type         OrgType  // COOPERATIVE | RESTAURANT_GROUP | GOVERNMENT | CORPORATE
  bbeeeLevel   Int?     // 1-8; null if not yet verified
  bbeeeExpiry  DateTime?
  registrationNumber String?
  vatNumber    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  farmers      Farmer[]
  buyers       Buyer[]
  addresses    Address[]
  documents    Document[]
}

enum OrgType {
  COOPERATIVE
  RESTAURANT_GROUP
  HOTEL
  GOVERNMENT
  CORPORATE_CATERER
  INDIVIDUAL
}
```

### Farmer

An individual farmer or cooperative member who lists produce.

```prisma
model Farmer {
  id             String       @id @default(uuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id])
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  
  displayName    String
  province       Province
  district       String
  gpsLat         Decimal?
  gpsLng         Decimal?
  bankAccountRef String?      // encrypted; references PSP-stored account
  
  isSmallholder  Boolean      @default(false)
  ficaVerified   Boolean      @default(false)
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  listings       ProduceListing[]
  payouts        Payout[]
  qualityChecks  QualityCheck[]
}

enum Province {
  LIMPOPO
  MPUMALANGA
  GAUTENG
  NORTH_WEST
  FREE_STATE
  KWAZULU_NATAL
  WESTERN_CAPE
  EASTERN_CAPE
  NORTHERN_CAPE
}
```

### Buyer

A restaurant, hotel, caterer, or government entity that places orders.

```prisma
model Buyer {
  id             String       @id @default(uuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id])
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  
  displayName    String
  buyerType      BuyerType
  deliveryAddress Address     @relation(fields: [deliveryAddressId], references: [id])
  deliveryAddressId String
  
  preferredPaymentTerms Int   @default(7)  // days
  creditLimit    Decimal?     // ZAR
  
  whatsappNumber String?
  
  ficaVerified   Boolean      @default(false)
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  orders         Order[]
}

enum BuyerType {
  RESTAURANT
  HOTEL
  CATERER
  GOVERNMENT_SCHOOL
  GOVERNMENT_HOSPITAL
  GOVERNMENT_CORRECTIONAL
  CORPORATE
  RETAILER
}
```

### ProduceListing

A farmer's available produce, including price, volume, and availability window.

```prisma
model ProduceListing {
  id             String          @id @default(uuid())
  farmerId       String
  farmer         Farmer          @relation(fields: [farmerId], references: [id])
  
  productId      String
  product        Product         @relation(fields: [productId], references: [id])
  
  gradeId        String?
  grade          ProduceGrade?   @relation(fields: [gradeId], references: [id])
  
  farmGatePrice  Decimal         // ZAR per kg
  availableKg    Decimal
  minimumOrderKg Decimal         @default(50)
  
  availableFrom  DateTime
  availableUntil DateTime
  
  status         ListingStatus   @default(ACTIVE)
  
  photos         ListingPhoto[]
  
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  deletedAt      DateTime?

  orderItems     OrderItem[]
}

enum ListingStatus {
  DRAFT
  ACTIVE
  RESERVED
  SOLD_OUT
  EXPIRED
  SUSPENDED
}
```

### Product

Master catalogue of produce types.

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String   // "Tomatoes (Round)", "Avocados (Hass)"
  category    ProductCategory
  unitType    UnitType @default(KG)
  hsCode      String?  // for export compliance
  
  listings    ProduceListing[]
  grades      ProduceGrade[]
}

enum ProductCategory {
  VEGETABLES
  FRUIT
  HERBS
  LEGUMES
  ROOT_VEGETABLES
}

enum UnitType {
  KG
  UNIT
  CRATE
  PALLET
}
```

### Order

A buyer's confirmed purchase from one or more listings.

```prisma
model Order {
  id               String      @id @default(uuid())
  orderNumber      String      @unique  // FC-2026-001234
  buyerId          String
  buyer            Buyer       @relation(fields: [buyerId], references: [id])
  
  status           OrderStatus @default(PENDING)
  
  deliveryDate     DateTime
  deliveryWindowStart DateTime?
  deliveryWindowEnd   DateTime?
  
  totalFarmGateValue  Decimal  // sum of (farmGatePrice * qty)
  buyerCommissionRate Decimal  @default(0.08)
  sellerCommissionRate Decimal @default(0.05)
  logisticsCharge     Decimal
  deliveredPrice      Decimal  // what buyer pays
  
  paymentTermDays  Int         @default(7)
  paymentDueDate   DateTime?
  
  notes            String?
  whatsappOrderRef String?     // incoming WhatsApp message ID
  
  source           OrderSource @default(WEB)
  
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  deletedAt        DateTime?

  items            OrderItem[]
  delivery         Delivery?
  payment          Payment?
  invoice          Invoice?
  qualityChecks    QualityCheck[]
  payouts          Payout[]
}

enum OrderStatus {
  PENDING
  CONFIRMED
  QUALITY_CHECKED
  IN_TRANSIT
  AT_HUB
  OUT_FOR_DELIVERY
  DELIVERED
  DISPUTED
  CANCELLED
  REFUNDED
}

enum OrderSource {
  WEB
  WHATSAPP
  FIELD_AGENT
  API
}
```

### OrderItem

A line item linking an Order to a specific ProduceListing.

```prisma
model OrderItem {
  id           String         @id @default(uuid())
  orderId      String
  order        Order          @relation(fields: [orderId], references: [id])
  listingId    String
  listing      ProduceListing @relation(fields: [listingId], references: [id])
  
  quantityKg   Decimal
  farmGatePrice Decimal       // price at time of order
  deliveredPrice Decimal      // price buyer pays per kg
}
```

### QualityCheck

Photo verification and grading performed by field agent at collection point.

```prisma
model QualityCheck {
  id           String            @id @default(uuid())
  orderId      String
  order        Order             @relation(fields: [orderId], references: [id])
  farmerId     String
  farmer       Farmer            @relation(fields: [farmerId], references: [id])
  fieldAgentId String
  fieldAgent   User              @relation(fields: [fieldAgentId], references: [id])
  
  gradeAwarded QualityGrade
  quantityKg   Decimal           // actual weighed quantity
  rejectedKg   Decimal           @default(0)
  notes        String?
  
  photos       QualityCheckPhoto[]
  
  performedAt  DateTime
  createdAt    DateTime          @default(now())
}

enum QualityGrade {
  A        // export quality
  B        // restaurant quality
  C        // processing / second grade
  REJECTED
}
```

### Delivery

Logistics record for a single delivery run.

```prisma
model Delivery {
  id             String         @id @default(uuid())
  orderId        String         @unique
  order          Order          @relation(fields: [orderId], references: [id])
  
  routeId        String?
  route          LogisticsRoute? @relation(fields: [routeId], references: [id])
  
  status         DeliveryStatus @default(SCHEDULED)
  
  vehicleRef     String?        // reference to contracted transport vehicle
  driverName     String?
  driverPhone    String?
  
  collectionAt   DateTime?      // actual collection timestamp
  hubArrivalAt   DateTime?
  deliveredAt    DateTime?
  
  trackingUrl    String?
  proofOfDelivery String?       // Cloudflare R2 photo URL
  
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

enum DeliveryStatus {
  SCHEDULED
  COLLECTED
  AT_HUB
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
  RETURNED
}
```

### LogisticsRoute

A planned daily route on a corridor (e.g., Tzaneen → Gauteng Hub).

```prisma
model LogisticsRoute {
  id           String      @id @default(uuid())
  name         String      // "N1 Daily — Tzaneen → JHB Hub"
  corridor     Corridor
  departureTime String     // "04:00"
  estimatedHours Int
  isActive     Boolean     @default(true)
  
  deliveries   Delivery[]
}

enum Corridor {
  LIMPOPO_GAUTENG
  MPUMALANGA_GAUTENG
}
```

### Payment

Buyer payment for an order.

```prisma
model Payment {
  id           String        @id @default(uuid())
  orderId      String        @unique
  order        Order         @relation(fields: [orderId], references: [id])
  
  amount       Decimal
  currency     String        @default("ZAR")
  method       PaymentMethod
  pspReference String?       // Ozow / Stitch transaction ID
  status       PaymentStatus @default(PENDING)
  
  dueDate      DateTime
  paidAt       DateTime?
  
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

enum PaymentMethod {
  INSTANT_EFT   // Ozow
  ACCOUNT_TO_ACCOUNT  // Stitch
  CARD
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  OVERDUE
  FAILED
  REFUNDED
}
```

### Payout

Farmer payment disbursed within 48 hours of delivery confirmation.

```prisma
model Payout {
  id           String       @id @default(uuid())
  orderId      String
  order        Order        @relation(fields: [orderId], references: [id])
  farmerId     String
  farmer       Farmer       @relation(fields: [farmerId], references: [id])
  
  grossAmount  Decimal      // farm-gate value
  commission   Decimal      // FarmConnect 5% seller commission
  netAmount    Decimal      // what farmer receives
  
  pspReference String?
  status       PayoutStatus @default(PENDING)
  
  scheduledFor DateTime     // 48hrs after delivery confirmation
  paidAt       DateTime?
  
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  CANCELLED
}
```

### Invoice

Auto-generated tax invoice for buyers.

```prisma
model Invoice {
  id            String        @id @default(uuid())
  invoiceNumber String        @unique  // INV-2026-001234
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id])
  
  buyerSnapshot Json          // buyer details at time of invoice
  lineItems     Json          // order items snapshot
  
  subtotal      Decimal
  vatAmount     Decimal       // 15% on service fees; 0% on fresh produce
  total         Decimal
  
  pdfUrl        String?       // Cloudflare R2
  status        InvoiceStatus @default(DRAFT)
  
  issuedAt      DateTime?
  dueDate       DateTime?
  
  createdAt     DateTime      @default(now())
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}
```

### User

Platform user account (auth identity).

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  role         UserRole
  
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  farmer       Farmer?
  buyer        Buyer?
  
  qualityChecksPerformed QualityCheck[]
}

enum UserRole {
  FARMER
  BUYER
  FIELD_AGENT
  LOGISTICS_COORDINATOR
  SALES_REP
  ADMIN
  SUPER_ADMIN
}
```

---

## Supporting Entities

- **Address** — physical delivery or collection addresses with GPS coordinates
- **Document** — B-BBEE certificates, FICA docs, food safety certificates (linked to Organization or Farmer)
- **ListingPhoto** — produce listing photos stored on Cloudflare R2
- **QualityCheckPhoto** — field agent grading photos
- **AuditLog** — immutable log of all state changes for compliance
- **ProduceGrade** — configurable grading standards per product (size, colour, blemish tolerance)
