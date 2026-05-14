# Development Roadmap

## Operating Principle

**Prove before scaling.** One corridor must be contribution-margin positive before we touch a second. Every feature decision is evaluated against the question: does this get us to 25-30 restaurants ordering weekly?

---

## Phase 0: Pre-Launch Hardening (Weeks 1-4)

The MVP is built. This phase makes it production-ready for the Limpopo-Gauteng corridor.

### Infrastructure
- [ ] Production Docker Compose setup (API + worker + Postgres + Redis + Nginx)
- [ ] Cloudflare DNS + SSL configured for `farmconnect.co.za` and `api.farmconnect.co.za`
- [ ] Cloudflare R2 bucket provisioned and access credentials configured
- [ ] Sentry error tracking integrated (backend + frontend)
- [ ] Environment variable management (.env.example documented)
- [ ] Backup strategy: daily Postgres dumps to R2

### Data Models
- [ ] Prisma schema for all core entities (see [Data Models](DATA_MODELS.md))
- [ ] Initial migrations written and tested
- [ ] Seed data: 3 product types (tomatoes, peppers, avocados), grade standards
- [ ] Admin user seeded

### Authentication
- [ ] JWT auth with refresh token rotation
- [ ] Role-based middleware (all 7 roles)
- [ ] FICA document upload flow
- [ ] Phone number verification (Clickatell OTP)

### Farmer Module
- [ ] Farmer registration and profile
- [ ] Cooperative linking
- [ ] Produce listing creation with photo upload
- [ ] Listing CRUD with status management

### Buyer Module
- [ ] Buyer registration and profile
- [ ] Browse listings with filters
- [ ] Web order placement
- [ ] Order tracking dashboard

### Quality Check Module
- [ ] Field agent PWA (offline-capable)
- [ ] Quality check submission with photos
- [ ] Order status updates on submission

### Payments
- [ ] Ozow instant EFT integration
- [ ] Stitch account-to-account integration
- [ ] Webhook handlers for both PSPs
- [ ] BullMQ payout queue (48-hour delayed job)
- [ ] Manual payout retry (Admin)

### Notifications
- [ ] Clickatell WhatsApp outbound templates (all 5 templates submitted for approval)
- [ ] SendGrid transactional email (invoice, registration, dispute)
- [ ] BullMQ notifications queue

### Invoicing
- [ ] Auto-generate PDF invoice on delivery confirmation
- [ ] Upload to R2, email to buyer
- [ ] VAT-compliant format (zero-rated produce + 15% on service fee)

### Admin Dashboard
- [ ] Order management view (all orders, filter by status/date/corridor)
- [ ] Farmer and buyer account management
- [ ] Dispute resolution interface
- [ ] Manual payout trigger
- [ ] FICA document review

---

## Phase 1: Corridor Launch (Months 1-3)

Commercial launch of the Limpopo-Gauteng tomato corridor. **Target: 25-30 restaurants ordering weekly by Month 3.**

### Month 1 — Pilots (15-20 restaurants, 3 cooperatives)
- [ ] 3 cooperative onboardings completed (ZZ2, Mahela, one smallholder coop)
- [ ] 15-20 restaurant buyers onboarded in Sandton/Rosebank
- [ ] First live order placed and delivered
- [ ] Field agent deployed in Tzaneen
- [ ] First contracted refrigerated transport run on N1

**Key metrics to hit:**
- Delivery on time (within window): > 90%
- Quality dispute rate: < 5%
- Farmer payout within 48hrs: 100%
- Buyer reorder rate (Week 2): > 70%

### Month 2 — Scale to 50 Restaurants
- [ ] WhatsApp ordering flow live (buyers can order via WhatsApp)
- [ ] 50 restaurant buyers active
- [ ] 5 cooperatives supplying
- [ ] Logistics route optimised (route coordinator + logistics contractor review)
- [ ] Standing orders feature (recurring weekly orders) — if reorder data warrants

### Month 3 — Breakeven Approach
- [ ] 80 restaurants ordering weekly
- [ ] 8 cooperatives supplying
- [ ] Monthly GMV: R240K+
- [ ] Corridor unit economics review: is R1.25/kg net contribution holding?
- [ ] Quality grading system calibrated (field agent + cooperative feedback)

---

## Phase 2: Multi-Corridor + B2G (Months 4-18)

**Trigger for Phase 2:** Single corridor contribution-margin positive for 2 consecutive months.

### Corridor 2: Mpumalanga-Gauteng (Month 4-6)
- [ ] Second field agent hired and deployed
- [ ] Mpumalanga cooperative onboarding (subtropical fruit, potatoes)
- [ ] Second logistics route on N4 corridor
- [ ] Demand planning feature (weekly forecasts to farmers)

### B2G Pilot (Month 10-12)
- [ ] Government buyer portal (separate onboarding flow)
- [ ] School feeding programme pilot (target: one district municipality)
- [ ] B-BBEE impact reporting module
- [ ] Government-compliant invoicing (PO reference, supplier number fields)
- [ ] Signed pilot contract with one municipal buyer

### Platform Maturity (Month 7-18)
- [ ] Supplier scorecard (quality, reliability, on-time supply)
- [ ] Buyer credit management (Stitch bank data integration for limit assessment)
- [ ] Automated payout reconciliation (reduce Admin manual work)
- [ ] Multi-product corridors (avocados, peppers, citrus)
- [ ] Full API for potential government ERP integration

### Series A Readiness Checklist (Month 18-24)
- [ ] Single corridor contribution-margin positive
- [ ] 100+ restaurants ordering weekly
- [ ] 10+ cooperatives supplying reliably
- [ ] Signed B2G pilot contract
- [ ] R50M+ annualised GMV run rate
- [ ] Stable unit economics: R1.25/kg net contribution or better

---

## Phase 3: Multi-Province + B2C (Year 3+)

**Trigger:** Series A raised, B2G contract signed.

- Additional province corridors (KwaZulu-Natal, Western Cape)
- Consumer subscription boxes (React Native app)
- Predictive demand forecasting (ML on order history)
- Full government ERP integration (LOGIS API)
- Potential East Africa expansion (if SA model validated)

---

## Feature Priority Framework

When deciding what to build next, score against:

| Criterion | Weight |
|-----------|--------|
| Does it increase weekly GMV? | 40% |
| Does it reduce operational cost per kg? | 25% |
| Does it reduce buyer or farmer churn? | 20% |
| Does it enable a new revenue stream? | 15% |

Anything scoring < 50% total does not get built in Phase 1.

---

## What We Will NOT Build in Phase 1

- Consumer-facing app (Phase 3)
- Microservices architecture (monolith until > R500M GMV)
- AI-powered price discovery (manual pricing works; complexity adds zero value)
- In-house logistics (asset-light is the model)
- Blockchain traceability (adds cost, zero buyer willingness to pay at Phase 1 volumes)
- Native mobile app for buyers (WhatsApp + web PWA is sufficient)
