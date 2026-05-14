# Payments

All payment flows run through licensed Payment Service Providers. FarmConnect never holds client funds — this is a structural choice to stay clear of National Payment System Act obligations.

---

## PSP Integrations

| PSP | Use Case | Why |
|-----|----------|-----|
| **Ozow** | Buyer instant EFT payments | Low cost, real-time settlement, no card needed |
| **Stitch** | Account-to-account & payment terms | Supports 7-day terms, direct bank debits |

Both PSPs are licensed under the National Payment System Act. FICA/KYC requirements are satisfied through their onboarding, supplemented by our own verification flow.

---

## Buyer Payment Flow

```
Buyer places order (status: PENDING)
        │
        ▼
FarmConnect creates payment record (status: PENDING)
        │
        ├── Immediate payment path (Ozow Instant EFT)
        │         │
        │         ▼
        │   Buyer redirected to Ozow payment page
        │         │
        │         ▼
        │   Ozow webhook → POST /webhooks/ozow
        │         │
        │         ▼
        │   Payment status → PAID
        │   Order status → CONFIRMED
        │
        └── Term payment path (Stitch, 7-day terms)
                  │
                  ▼
            Buyer approved for credit limit (pre-assessed)
                  │
                  ▼
            Delivery confirmed → payment due date = delivery + 7 days
                  │
                  ▼
            Stitch initiates debit on due date
                  │
                  ├── Success → Payment PAID
                  └── Failure → Retry → Overdue → Suspend account
```

### Payment Webhook Security

Both Ozow and Stitch send signed webhooks. We verify HMAC signatures before processing:

```typescript
function verifyOzowWebhook(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha512', process.env.OZOW_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

Webhook endpoints return `200 OK` immediately and process via BullMQ queue — never synchronously.

---

## Farmer Payout Flow

```
Buyer confirms delivery (or system auto-confirms after 48hrs)
        │
        ▼
Payout record created (status: PENDING, scheduledFor: now + 48hrs)
        │
        ▼
BullMQ delayed job fires at scheduledFor time
        │
        ▼
For each farmer/cooperative with items in the order:
  netAmount = (farmGatePrice × quantityKg) × (1 - 0.05 seller commission)
        │
        ▼
Stitch account-to-account transfer → farmer's bank account
        │
        ├── Success → Payout status: PAID
        │             Farmer receives WhatsApp/SMS notification
        │
        └── Failure → Payout status: FAILED
                      Admin notified immediately
                      Admin retries within 24hrs (manual or automated retry)
```

### Payout Breakdown (Example)

```
Order: 200kg tomatoes @ R5.50/kg farm-gate

Gross value:              R1,100.00
Less 5% seller commission:  R55.00
Net payout to farmer:     R1,045.00

Buyer paid:               R3,200.00 (200kg × R16.00/kg delivered)
FarmConnect retains:
  - Buyer commission (8% of R3,200):    R256.00
  - Seller commission (5% of R1,100):    R55.00
  - Gross margin:                        R311.00
  Less: logistics cost (200kg × R4.50): R900.00
  Less: quality/ops (200kg × R0.45):     R90.00
  = Net contribution:                   -R679.00  ← needs volume to work

At corridor break-even (54,400 kg/month):
  Net contribution per month:           ~R67,600  ← covers fixed costs of ~R68,000
```

---

## Commission Ledger

Every order creates commission entries that form the revenue reconciliation:

| Entry type | Amount | When created |
|------------|--------|-------------|
| Buyer commission earned | 8% of delivered value | On delivery confirmation |
| Seller commission earned | 5% of farm-gate value | On delivery confirmation |
| Logistics cost | Actual transport cost | On delivery confirmation |
| Quality/ops cost | Budgeted R0.45/kg | On delivery confirmation |
| Net margin | Revenue - costs | Computed at reporting |

Commission entries are immutable once created (append-only ledger). Refunds create offsetting entries, not corrections.

---

## VAT Treatment

| Transaction | VAT Rate | Reason |
|-------------|----------|--------|
| Fresh produce (tomatoes, vegetables) | 0% | Zero-rated under VAT Act s.11(1)(j) |
| FarmConnect service fees (commissions) | 15% | Standard-rated once turnover > R1M |
| Logistics coordination fee | 15% | Standard-rated service |

Until annual turnover exceeds R1M, FarmConnect is not required to register for VAT. Register proactively at R800K turnover to allow lead time.

VAT-compliant invoice format:
- Supplier name, address, VAT number
- Invoice number and date
- Buyer name, address
- Line items with separate VAT treatment
- Zero-rated items listed separately from standard-rated
- Total VAT amount

---

## Payment Terms by Buyer Type

| Buyer Type | Default Terms | Maximum Terms | Credit Assessment |
|-----------|--------------|---------------|-------------------|
| Independent restaurant | 7 days | 14 days | Order history + Stitch bank data |
| Hotel group | 14 days | 30 days | Credit check + trading history |
| Corporate caterer | 14 days | 30 days | Credit check |
| Government | 30 days | 30 days | Confirmed PO required |
| New buyer | Cash on delivery | 7 days (after 3 orders) | — |

### Credit Limit Management

- Credit limits set by Admin based on buyer payment history and Stitch bank verification
- Buyers cannot place orders that would exceed their outstanding credit limit
- Overdue payment > 7 days: automatic hold on new orders, Admin notified
- Overdue payment > 14 days: account suspended; Admin escalates

---

## Refunds and Credits

| Scenario | Resolution | Timeline |
|----------|-----------|----------|
| Quality dispute upheld | Full or partial credit note | 24hrs after Admin decision |
| Cold chain failure | Full refund | 24hrs |
| Short delivery confirmed | Partial refund for missing kg | 24hrs |
| Order cancelled pre-dispatch | Full refund | Immediate |
| Order cancelled post-dispatch | Logistics cost retained; produce refunded | 24hrs |

Refunds are processed via the original payment method. Credit notes are applied to the buyer's next order.

---

## Working Capital Bridge

FarmConnect pays farmers in 48hrs but collects from buyers in 7-14 days. This creates a working capital gap:

```
Volume: 54,400 kg/month corridor break-even
Farm-gate value: 54,400 × R5.50 = R299,200 paid to farmers every 48hrs
Buyer revenue: collected over 7-14 days

Working capital required: ~R500K-R1M at launch volumes
```

This is covered by the seed round working capital allocation. As volume grows, we explore:
- Stitch receivables financing (advance on confirmed orders)
- Invoice discounting via a financial partner
- Buyer prepayment incentive (0.5% discount for immediate EFT)
