# Feature Specifications

Features are organized by user segment and development phase. Phase 1 covers the Limpopo-Gauteng corridor launch. Phases 2-3 cover multi-corridor expansion and government procurement.

---

## Phase 1: Corridor Launch (Months 1-6)

### Farmer Features

#### F1 — Farmer Onboarding
- Self-registration via web or WhatsApp (field agent assisted for offline farmers)
- Profile: name, province, GPS location, cooperative membership
- Bank account tokenisation via Stitch (never stored raw in our DB)
- FICA/KYC document upload (ID, proof of bank account)
- B-BBEE status capture (EME auto-classification, sworn affidavit upload)

**Acceptance criteria:**
- Farmer can complete onboarding in < 10 minutes with field agent assistance
- FICA docs verified within 24 hours by admin
- Bank account tokenisation works over low-bandwidth mobile connection

#### F2 — Produce Listings
- Create listing: product, price (ZAR/kg), available volume, date window
- Upload up to 5 photos per listing
- Set minimum order quantity
- Edit or deactivate listings
- View active listings and reservation status

#### F3 — Order Notifications
- WhatsApp notification when order placed against a listing
- Notification includes: buyer name, quantity, delivery date, estimated payout
- Accept/reject order confirmation within 2 hours

#### F4 — Payout Dashboard
- View payout history and status (pending, processing, paid)
- Expected payout date (48hrs after delivery confirmation)
- Payout breakdown: gross value, 5% commission deducted, net received
- Download payout statements (PDF)

---

### Buyer Features

#### B1 — Buyer Onboarding
- Registration: business name, type, delivery address
- FICA/KYC verification
- Credit limit assessment for 7-14 day payment terms
- WhatsApp number registration for ordering

#### B2 — Browse & Order (Web)
- Browse active listings filtered by product, province, availability, grade
- Side-by-side price comparison (market price vs. FarmConnect delivered price)
- Add to cart, select delivery date, review order summary
- Place order and receive order number

#### B3 — WhatsApp Ordering
- Text-based order placement ("order 200kg tomatoes for Thursday")
- System returns listing options with prices
- Buyer confirms by replying to WhatsApp message
- Order confirmation and delivery ETA sent back via WhatsApp

**Acceptance criteria:**
- Complete order in < 3 WhatsApp messages
- Works on basic Android phones with standard WhatsApp

#### B4 — Order Tracking
- Real-time order status: confirmed → quality checked → in transit → delivered
- Estimated delivery window (2-hour slot)
- Driver contact for last-mile delivery
- Push/WhatsApp notification at each status change

#### B5 — Payment
- Instant EFT via Ozow (pay immediately)
- Account-to-account via Stitch (pay on 7-day terms if approved)
- Invoice auto-generated and emailed on delivery confirmation
- Payment history and outstanding invoices dashboard

#### B6 — Quality Dispute
- Submit quality dispute within 24 hours of delivery
- Upload photos of quality failure
- 24-hour resolution: refund or credit note
- View dispute history and resolutions

---

### Field Agent Features

#### A1 — Quality Check Submission
- Mobile-optimised PWA (works offline, syncs when connected)
- Select order from daily collection schedule
- Record actual weighed quantity, rejected quantity
- Select quality grade (A/B/C/Rejected) with grade guide reference
- Upload minimum 3 photos per quality check
- Submit check — triggers order status to QUALITY_CHECKED

#### A2 — Daily Schedule
- View assigned collections for the day by farm/cooperative
- Collection point GPS navigation
- Mark collection as complete

---

### Operations Features

#### O1 — Logistics Coordination Dashboard
- Admin view of all active orders and their delivery status
- Assign orders to routes and drivers
- Update delivery status (collected, at hub, out for delivery, delivered)
- View route manifest for each daily run

#### O2 — Dispute Resolution
- View open quality disputes
- Mediate between buyer and farmer
- Issue refund or credit note
- Dispute history and resolution rate reporting

#### O3 — Payout Management
- View pending payouts scheduled for next 48hrs
- Manually trigger or retry failed payouts
- Payout audit log (required for FICA compliance)

---

## Phase 2: Multi-Corridor + B2G Pilot (Months 7-18)

### B2G Features

#### G1 — Government Buyer Portal
- Separate onboarding flow for government procurement officers
- CIDB/CSD registration number capture
- Tender reference linking for school feeding orders
- Volume-based ordering (bulk annual contracts)
- Compliant invoicing with required government reference fields

#### G2 — B-BBEE Reporting for Government
- Automated supplier spend report by B-BBEE level
- Smallholder farmer supply percentage
- Supplier development hours (field agent training tracked)
- Export as required format for government compliance submissions

### Platform Features

#### P1 — Mpumalanga-Gauteng Corridor
- Second corridor: subtropical fruit, potatoes, peppers
- New cooperative onboarding in Mpumalanga
- Route extension to Gauteng hub

#### P2 — Demand Planning
- Weekly demand forecasts sent to farmers (based on standing orders)
- Farmer can pre-commit supply for upcoming weeks
- Reduces last-minute unavailability and over-ordering

#### P3 — Standing Orders
- Buyers set up recurring weekly orders (same produce, same day)
- Auto-confirmed if listing available; manual confirmation if not
- Switching cost: buyer loses standing order priority if they leave

---

## Phase 3: Multi-Province + B2C (Year 3+)

### B2C Features
- Consumer-facing app (React Native)
- Aggregated weekly delivery boxes (farm-to-doorstep)
- Subscription model for regular consumers

### Platform Maturity
- Supplier scorecard (quality, reliability, volume consistency)
- Predictive route optimisation
- Automated payout reconciliation (no manual admin)
- Full API for government ERP integration (SAP, LOGIS)

---

## Feature Flags

All Phase 2+ features should be behind feature flags so they can be enabled per corridor/account without a deployment:

```
FLAG_B2G_PORTAL         — government buyer onboarding
FLAG_STANDING_ORDERS    — recurring weekly orders
FLAG_DEMAND_PLANNING    — forecast visibility for farmers
FLAG_MPUMALANGA_CORRIDOR — second corridor listings
```
