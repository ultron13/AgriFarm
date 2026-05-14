# Logistics Operations

FarmConnect is asset-light on logistics. We coordinate transport we don't own, optimise routes we don't drive, and manage quality we don't physically touch. The model only works if coordination is tighter than ownership.

---

## Corridor: Limpopo to Gauteng (N1)

### The Route

```
Tzaneen / Polokwane region (farm collection points)
        │
        │ 04:00 — Contracted refrigerated truck departs
        │ ~360 km via N1 highway
        ▼
Midrand / Meadowdale Micro-Hub (Gauteng)
        │ 10:00-11:00 — Sort, repack, route-optimise last-mile
        │
        ├──► Sandton restaurant deliveries (11:00-14:00)
        ├──► Rosebank restaurant deliveries (11:00-14:00)
        └──► Melrose / Illovo deliveries (13:00-16:00)
```

### Daily Schedule

| Time | Event |
|------|-------|
| 06:00 PM (D-1) | Field agent photographs and grades produce at cooperative cold rooms |
| 07:00 PM (D-1) | Quality check submitted, order moves to QUALITY_CHECKED |
| 08:00 PM (D-1) | Logistics coordinator confirms route manifest |
| 04:00 AM (D) | Truck departs Tzaneen collection point |
| 10:00 AM (D) | Truck arrives Gauteng micro-hub |
| 11:00 AM (D) | Last-mile deliveries begin |
| 14:00 PM (D) | Target: all deliveries complete |
| 16:00 PM (D) | Buyer delivery confirmations collected |
| 16:01 PM (D) | 48-hour farmer payout clock starts |

---

## Collection Points

| Point | Location | Cold Room | Typical Volume |
|-------|----------|-----------|----------------|
| Mahela Hub | Tzaneen | ✓ (cooperative-owned) | 3-5 tonnes/day |
| ZZ2 Gate | Mooketsi | ✓ | 2-4 tonnes/day |
| Mogalakwena Coop | Mokopane | — (shade structure) | 500kg-1 tonne/day |
| Limpopo Tomato Growers | Groblersdal | ✓ | 1-2 tonnes/day |

**Field agent rule:** Never collect from a point without a cold room unless the produce is being transported within 3 hours. Cold-chain integrity is non-negotiable.

---

## Contracted Transport

We operate asset-light — contracted refrigerated transport, not owned:

| Vehicle Type | Capacity | Target Rate | Scenario |
|-------------|----------|-------------|----------|
| 3-tonne refrigerated panel van | 3,000 kg | R6,000-8,000/trip | Phase 1 (low volume) |
| 8-tonne refrigerated truck | 8,000 kg | R10,000-14,000/trip | Phase 1-2 (break-even+) |
| Consolidated container | 20,000 kg | Negotiated contract | Phase 2+ |

**Logistics cost target:** R4.00-4.50/kg delivered (incorporated in the R16/kg delivered price to buyers). As volume scales, negotiate dedicated routes at volume discounts — target R3.00/kg at 100+ tonnes/month.

---

## Gauteng Micro-Hub

**Phase 1:** Leased space at an existing cold chain facility in Midrand or Meadowdale (market facilities — no capital outlay).  
**Phase 2:** Dedicated leased hub once > 20 tonnes/day.

Hub operations:
1. Receive delivery from transport contractor
2. Verify against route manifest (quantity, grade)
3. Break bulk and sort by buyer order
4. Load route-optimised last-mile vehicles
5. Dispatch with signed delivery manifest per restaurant

---

## Last-Mile Delivery

- Consolidated delivery — not individual runs per restaurant
- Maximum 8-10 drops per last-mile vehicle
- Target: all Sandton/Rosebank/Melrose drops within 3km radius per route
- Driver carries signed delivery manifest
- On delivery: buyer or chef signs receipt
- Driver captures proof of delivery photo via field agent app

---

## Route Optimisation

Phase 1: Manual route planning by logistics coordinator (Google Maps + delivery manifest spreadsheet).  
Phase 2: Route optimisation algorithm (open-source OSRM or Google Maps Routes API) once > 30 drops/day.

---

## Cold Chain Protocol

| Stage | Temperature Requirement | Responsibility |
|-------|------------------------|----------------|
| On-farm | < 15°C (tomatoes) | Cooperative |
| Collection point | < 12°C | Field Agent to verify |
| In-transit | 8-12°C (tomatoes) | Transport contractor |
| Micro-hub | < 12°C | Hub operator |
| Last-mile vehicle | < 15°C | Last-mile contractor |
| On delivery | Buyer signs for cold-chain intact | Buyer |

**If cold chain is broken:** Field agent or driver must report immediately. Affected produce is not delivered. Farmer is compensated for confirmed cold-chain failures caused by our logistics (not on-farm). Buyer receives credit note.

---

## Quality at Collection

### What Field Agents Check

1. **Grade assessment** — visual grading to FarmConnect standard (A/B/C/Reject)
2. **Quantity** — weigh on calibrated scale; record actual vs. contracted kg
3. **Cold chain** — confirm collection point temperature with probe thermometer
4. **Photos** — minimum 3 photos: full load, representative sample, any quality issues
5. **Reject recording** — rejected produce is returned to farmer, not transported

### Grade Standards (Tomatoes)

| Grade | Description | Typical Use |
|-------|-------------|-------------|
| A | Uniform size, no blemishes, firm, export colour | Premium restaurants |
| B | Minor surface marks (< 5% skin), uniform size ±15% | Standard restaurant use |
| C | Surface blemishes, size variation > 15%, still food-safe | Food processors, soup |
| Reject | Cracked, mouldy, pest damage, or bruised > 20% | Not transported |

---

## Shrinkage and Loss

**Budgeted shrinkage:** 5% (R0.45/kg in unit economics, included in R16/kg delivered price).

| Loss type | Expected % | Mitigation |
|-----------|-----------|------------|
| Field rejection at collection | 2-3% | Grade standards + farmer coaching |
| In-transit damage | 0.5-1% | Cold chain + padding |
| Hub sorting loss | 0.5% | Careful handling |
| Delivery disputes | 0.5-1% | Photo evidence + grading |

If shrinkage exceeds 7% on a corridor, the corridor operating model is reviewed before adding a second corridor.

---

## Dispute Resolution: Logistics Failures

| Failure | Who Pays | Timeline |
|---------|----------|----------|
| Late delivery (> 2hr window) | FarmConnect (credit note to buyer) | 24hrs |
| Cold chain break (our fault) | FarmConnect (full refund) | 24hrs |
| Short delivery (weigh-verified) | FarmConnect (partial refund) | 24hrs |
| Wrong produce delivered | FarmConnect (full refund + replacement) | 48hrs |
| Quality failure (field agent error) | FarmConnect (refund; farmer is paid) | 24hrs |
| Quality failure (farmer fault) | Farmer (commission clawback) | 48hrs |
