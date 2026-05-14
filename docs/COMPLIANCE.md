# Regulatory & Compliance

**Estimated Year 1 compliance cost: R500K-R1.25M** — budgeted and non-negotiable.

---

## Corporate Structure

| Item | Detail |
|------|--------|
| Entity type | Private Company (Pty) Ltd |
| Legislation | Companies Act 71 of 2008 |
| Registration | CIPC — Companies and Intellectual Property Commission |
| Target ownership | ≥ 51% black ownership (for Level 1 B-BBEE) |
| EME threshold | Annual turnover < R10M — automatic Exempt Micro Enterprise |

**Action items:**
- [ ] CIPC registration (R175)
- [ ] Shareholders agreement reflecting B-BBEE ownership structure
- [ ] MOI (Memorandum of Incorporation) filed
- [ ] SARS income tax registration
- [ ] SARS VAT registration (at R800K turnover — pre-register for lead time)
- [ ] UIF registration (employer obligations once first hire)

---

## B-BBEE Strategy

B-BBEE compliance is core to the business model — it enables government procurement and is embedded in the platform, not bolted on.

### Classification

| Annual Turnover | Classification | B-BBEE Level |
|----------------|----------------|-------------|
| < R10M | EME | Automatic Level 4 |
| < R10M + ≥ 51% black-owned | EME | **Level 1** (target) |
| < R10M + ≥ 51% black-owned + ≥ 30% black female | EME | **Level 1** (enhanced) |

### AgriBEE Sector Code

Agricultural enterprises fall under the AgriBEE Sector Code. Key elements tracked and reported:

| Element | Weight | How FarmConnect Earns Points |
|---------|--------|------------------------------|
| Ownership | 25 | ≥ 51% black ownership |
| Management control | 19 | Black executives in GM/CEO role |
| Skills development | 20 | Field agent training, cooperative member workshops |
| Enterprise & supplier development | 40 | Smallholder farmer onboarding, payment terms advantage |
| Socio-economic development | 5 | Community contributions |

### Supplier Development (Built-In)

Every smallholder farmer onboarded counts as Supplier Development spend under the AgriBEE code:
- Platform access, training, and field agent support = quantifiable value
- 48-hour payment terms vs. industry standard 21+ days = financial development
- Record and report this quarterly for B-BBEE verification

### Platform Reporting for Buyers

Government buyers need B-BBEE-compliant supply chain reporting. FarmConnect auto-generates:
- % of procurement spend reaching Level 1-2 B-BBEE suppliers
- % reaching smallholder / black-owned farms
- Supplier development spend equivalent
- This is a competitive differentiator vs. informal suppliers who cannot produce this report

---

## POPIA (Protection of Personal Information)

**Act:** Protection of Personal Information Act 4 of 2013  
**Regulator:** Information Regulator of South Africa

### Obligations

| Requirement | Implementation |
|-------------|---------------|
| Lawful processing | Consent captured at registration; contract basis for order processing |
| Information officer | Designated DPO (Information Officer) appointed and registered with Information Regulator |
| Privacy policy | Published on platform; farmers/buyers must accept at registration |
| Retention | Personal data retained for 7 years (SARS requirement) then deleted |
| Data breach notification | Notify Information Regulator + affected persons within 72 hours |
| Cross-border transfers | No data transferred outside SA without adequate protection measures |
| Subject access requests | Respond within 30 days; portal for download/deletion requests |

### PII in the Platform

| Data Type | Classification | Storage | Access |
|-----------|---------------|---------|--------|
| Full name, email, phone | PII | Encrypted at rest (AES-256) | Role-restricted |
| ID number | Special PII | Encrypted at rest | Admin + FICA flow only |
| Bank account | Sensitive financial | NOT stored — PSP tokenised | PSP only |
| GPS coordinates | PII | Stored; used for route planning | Role-restricted |
| Photos (quality checks) | Business data | Cloudflare R2 | Role-restricted |
| Order history | Business data | Standard DB | Own records |

### Technical Implementation

```typescript
// PII fields must be marked in Prisma schema comments
// Encrypt before write, decrypt after read
// Never log PII fields — use userId references only

// Example: POPIA-compliant logging
logger.info('Order status updated', {
  orderId: order.id,
  fromStatus: from,
  toStatus: to,
  // DO NOT LOG: buyer name, email, phone, address
});
```

---

## FICA (Financial Intelligence Centre Act)

**Act:** FICA 38 of 2001  
**Why it applies:** FarmConnect facilitates financial transactions between parties.

### KYC Requirements

**Farmers (natural persons):**
- [ ] SA ID or passport
- [ ] Proof of residential address (< 3 months)
- [ ] Bank account verification (via Stitch account data)

**Farmers (legal entities — cooperatives):**
- [ ] Company registration documents (CIPC)
- [ ] List of beneficial owners (> 25% ownership)
- [ ] ID for each beneficial owner

**Buyers:**
- [ ] Business registration
- [ ] Tax clearance certificate
- [ ] Authorised signatory ID

### Implementation

All FICA verification is handled at onboarding before a user can transact. Documents uploaded to Cloudflare R2 (encrypted). Admin reviews and approves within 24hrs. Stitch handles enhanced bank account verification as part of their licensed PSP obligations.

**We are NOT an accountable institution under FICA** — our PSPs are. But we must satisfy their KYC requirements to use their services.

---

## Agricultural Produce Agents Act 12 of 1992

**Why this matters:** If FarmConnect were classified as a market agent, we'd need to be licensed under this Act, post a fidelity fund certificate, and comply with agent accounting rules.

**Our position:** FarmConnect is a technology marketplace, not an agricultural produce agent. We:
- Do not take physical possession of produce
- Do not act as agent on behalf of the farmer in the legal sense
- Charge a platform fee (commission), not an agency commission under the Act
- Do not operate as a market or exchange

**Risk mitigation:**
- Legal opinion obtained confirming marketplace classification (budget R25-50K)
- Terms of Service explicitly establish technology marketplace relationship
- Never describe ourselves as "agents" in marketing or legal documents
- Review this classification if/when we handle money flows differently (e.g., holding buyer funds)

---

## VAT Act 89 of 1991

| Scenario | Treatment |
|----------|-----------|
| Sale of fresh produce | Zero-rated (Schedule 2, s.11(1)(j)) |
| FarmConnect commission fees | Standard-rated at 15% |
| Logistics fees | Standard-rated at 15% |
| VAT registration threshold | R1M annual taxable supplies |
| Pre-registration target | Register at R800K (3-month lead time) |

FarmConnect invoices must clearly separate zero-rated produce value from standard-rated service fees.

---

## Food Safety

**Act:** Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972

FarmConnect does **not** handle or process food. We coordinate logistics but cooperatives and contracted transport are responsible for cold chain at their stages.

**No HACCP certification required** for FarmConnect as a platform company. This is a deliberate structural choice.

Cooperatives and contracted transport operators may need their own food safety certificates — we verify this as part of partner onboarding.

---

## Agricultural Product Standards Act 119 of 1990

Produce sold on the platform must meet the minimum grade standards prescribed under this Act for each product class. Field agents apply these standards during quality checks. The platform grade standards (A/B/C) are designed to be at or above the statutory minimums.

---

## National Credit Act 34 of 2005

**Risk:** If FarmConnect's 7-14 day payment terms are classified as "credit", we may need NCR registration.

**Position:** Payment terms extended to known businesses (not consumers) for commercial transactions are typically outside NCA scope. Legal opinion required before offering terms > 30 days or to individual farmer buyers.

---

## Compliance Calendar

| Month | Action | Cost |
|-------|--------|------|
| Pre-launch | CIPC registration, MOI, shareholders agreement | R10-20K |
| Pre-launch | Legal opinion: marketplace vs. agent classification | R25-50K |
| Pre-launch | Privacy policy, T&Cs, POPIA consent framework | R30-50K |
| Pre-launch | DPO appointed and registered with Information Regulator | Admin |
| Month 1 | PSP agreements signed (Ozow + Stitch) | PSP fees |
| Month 3 | B-BBEE sworn affidavit / EME certificate | R2-5K |
| Month 6 | SARS VAT registration | Admin |
| Month 12 | First B-BBEE verification (if > EME threshold) | R50-150K |
| Ongoing | Annual legal review of regulatory changes | R50-100K/yr |
