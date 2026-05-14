# FarmConnect SA — Business Plan

**Prepared:** May 2026  
**Version:** 1.0  
**Classification:** Confidential — For Investor & Partner Review

---

## 1. Executive Summary

A tomato leaves a farm in Limpopo at R5.50 per kilogram. By the time it reaches a restaurant kitchen in Sandton, the price has ballooned to R20-25/kg. The farmer didn't get richer. The chef didn't get a better tomato. The middlemen — bakkie traders, market agents, wholesalers — captured the difference. Multiply that across every fresh produce transaction in South Africa, and you're looking at tens of billions in value extracted annually from a system that feeds 60 million people.

FarmConnect SA kills that margin. We connect farmers directly to restaurants, food processors, and government buyers through a logistics-enabled digital marketplace. Not a listing site. Not a matching app. A platform that actually moves produce from point A to point B, handles quality grading, and pays farmers within 48 hours.

**The market:** South Africa's B2B food procurement runs R155-175 billion per year, yet only 2-5% of agricultural trade happens digitally [1][2][3]. Government procurement alone — school feeding programmes, hospitals, correctional services — accounts for R15-18 billion that no platform currently serves [3].

**Our approach:** We start with one corridor. Limpopo tomatoes to Gauteng restaurants. One product, one route, one buyer segment. We hit breakeven at 25-30 restaurants ordering weekly — roughly 54,400 kg per month — achievable within 3-4 months of launch.

**The ask:** R8-12M seed funding to launch the Gauteng corridor, prove unit economics, and reach R50-150M GMV in Year 1.

**The hard truth:** African agritech marketplaces fail at a rate of 70-85% within five years [7][20]. We put our probability of success at 15-25%. We improve those odds through extreme focus, a logistics-first model, and a corridor approach that proves viability before we spend a rand on scaling.

---

## 2. Who We Are

**Company:** FarmConnect SA (Pty) Ltd  
**Structure:** Exempt Micro Enterprise (EME), targeting ≥51% black ownership for Level 1 B-BBEE [15]

We're building toward a South African agricultural economy where every farmer — from large commercial operations to smallholder cooperatives in the former homelands — has direct digital access to buyers who pay fair prices, on time.

We start by fixing the fresh produce corridors that feed Gauteng. Reduce post-harvest losses. Cut out exploitative middlemen. Digitise trade that still runs on handshakes, cash, and bakkie loads.

**Where we stand today:** MVP built (Express/TypeScript backend, React/Vite frontend, PostgreSQL). Pre-revenue. Ready to launch commercially with seed funding.

**How we grow:**
- **Year 1 (B2B):** Farmers → Restaurants, Hotels, Caterers
- **Year 2 (B2G):** Farmers → Government school feeding programmes, hospitals
- **Year 3 (B2C):** Farmers → Consumers via aggregated delivery

---

## 3. The Market

### R155-175 Billion — and Almost None of It Digital

South Africa's B2B food procurement market breaks down like this:

| Segment | Annual Value | Source |
|---------|-------------|--------|
| Food processors | R60-70B | Stats SA Manufacturing Survey [2] |
| Restaurants & Hotels | R35-40B | RASA industry estimates [8] |
| Retailers & Spaza shops (fresh produce) | R25-30B | Mastercard/FinMark Trust [6] |
| Government procurement | R15-18B | National Treasury [3] |
| Corporate catering | R8-10B | Industry estimates |

A note on honesty: our initial market sizing came in at R218B. Independent validation knocked that down 25-30%. We present the conservative, defensible number here. [1][2][3]

### What We Can Actually Capture

| Timeframe | Target GMV | How |
|-----------|-----------|-----|
| Year 1 | R50-150M | Single corridor, 80-150 restaurants |
| Year 2 | R500M-1.5B | Multi-corridor, B2G pilot |
| Year 3 | R1.5-4B | Multi-province, government contracts |

### Why Now

The timing works in our favour. Only 2-5% of SA agricultural trade is digitised [5]. Government actively wants digital procurement solutions. Load-shedding and diesel costs push buyers toward shorter, more reliable supply chains. And the National School Nutrition Programme alone represents R9.5-10.2B in the current fiscal year [3] — a massive anchor contract waiting for someone to build the rails.

---

## 4. The Problem

South Africa grows enough food. We just can't get it from farm to plate without losing half the value along the way.

**Farmers** lose 40-55% of wholesale value to middlemen and market agents [4][5]. They wait 7-21 days for payment from fresh produce markets. Smallholders — the majority of black farmers in this country — can't access formal markets at all.

**Buyers** pay through the nose. A restaurant in Rosebank pays R20-25/kg for tomatoes that left the farm at R5.50/kg [5]. They juggle multiple informal suppliers with inconsistent quality, no digital ordering, no delivery tracking, and no proper invoicing.

**The system** wastes 30-40% of fresh produce to post-harvest losses [22]. Smallholder farmers stay locked out of economic participation. Food prices climb — not because of scarcity, but because of a bloated, opaque distribution chain that extracts value without creating it.

---

## 5. What We're Building

FarmConnect is a logistics-enabled marketplace. That distinction matters. Plenty of startups have tried "Uber for farming" — a matching platform that connects buyers and sellers and hopes the transaction happens. Those fail because the hard part isn't the connection. The hard part is physically moving 5 tonnes of tomatoes from Tzaneen to Sandton, graded, cold-chained, and delivered before the breakfast prep starts.

### For Farmers
- **Comparable price, guaranteed demand:** Net R5.22/kg after our 5% commission vs. R5.50/kg gross from bakkie traders — similar money, but with reliable weekly orders [5]
- **48-hour payment** vs. 7-21 days waiting at fresh produce markets
- **Demand visibility:** Know what buyers want before you harvest
- **Market access for smallholders** through cooperative aggregation

### For Buyers
- **20-36% savings** on current procurement prices [5]
- **Consistent quality:** Graded produce with photo verification at source
- **Digital ordering** via WhatsApp and web, with delivery tracking
- **Compliance sorted:** Invoices, B-BBEE certificates, food safety docs — all generated automatically

### For Government
- **Auditable procurement trail** — transparent, digital, corruption-resistant
- **Measurable transformation:** Track exactly how much spend reaches smallholder farmers
- **Better prices:** Direct-from-farm pricing for school feeding programmes

### What Makes Us Different

We don't just connect. We coordinate:
1. Quality grading at source (photo + field agent verification)
2. Aggregation across multiple smallholders to fill large orders
3. Route-optimised logistics (consolidated loads, not individual bakkie runs)
4. Payment bridging (farmers paid in 48hrs; buyers pay on 7-14 day terms)

---

## 6. Competitive Landscape

### Who We're Up Against

| Competitor | Threat | Why They're Strong | Where They Fall Short |
|-----------|--------|-------------------|---------------------|
| **Khula!** | HIGH | Naspers-backed, ~2,000 farmers, B2B focus | No logistics, no government channel [9] |
| **Checkers Sixty60** | HIGH (consumer) | 900+ stores, 3M+ downloads | Closed supply chain — won't open to smallholders [9] |
| **Twiga Foods** (Kenya) | MEDIUM-HIGH | $150M+ raised, 150K retailers | Not in SA yet; Kenya model may not transfer [9][20] |
| **HelloChoice** | MEDIUM | Established wholesale niche | ~500 sellers, wholesale only [9] |

### The Gaps Nobody's Filling

1. **Government procurement** (R12B+ annually) — zero platforms serve this channel
2. **Multi-channel** (B2B + B2C + B2G combined) — everyone picks one lane
3. **Smallholder aggregation with actual logistics** — matching without moving goods doesn't work

### How We Defend the Position Over Time
- 48-hour payment locks in farmer loyalty (try going back to 21-day cycles)
- Standing orders and procurement integration lock in buyers
- Corridor-level data on pricing, demand, and quality becomes a compounding advantage
- B-BBEE compliance as a built-in feature — informal suppliers can't offer this

---

## 7. Business Model & Unit Economics

### How We Make Money

| Stream | Rate | Applied To |
|--------|------|-----------|
| Buyer commission | 8% | Delivered order value |
| Seller commission | 5% | Farm-gate value |
| **Blended take rate** | **~10-11%** | **Total GMV** |

At launch, we charge 0% seller commission for the first 3 months and 6% buyer commission (rising to 8% after Month 3). We earn trust before we extract margin.

### The Tomato Corridor — Numbers That Work

```
Farm gate price (Limpopo):           R5.50/kg
+ Logistics & handling:              R4.50/kg
+ FarmConnect margin:                R1.55/kg
+ Quality/grading costs:             R0.45/kg
+ Buffer/shrinkage:                  R4.00/kg
= Delivered price to buyer:          R16.00/kg

Current restaurant price:            R20-25/kg
Buyer saving:                        20-36%

FarmConnect gross margin per kg:     R1.55
Less: payment processing, ops:       R0.30
= Net contribution:                  R1.25/kg
```

### Corridor Breakeven

| Metric | Value |
|--------|-------|
| Monthly fixed costs (1 corridor) | ~R68,000 |
| Volume needed to break even | 54,400 kg/month |
| Restaurants needed | 25-30 ordering weekly |
| Time to get there | 3-4 months from launch |

These are tight margins. We know that. But they're real margins on real transactions — not subsidised growth metrics. And they improve with volume as logistics costs per kilogram drop.

---

## 8. Go-to-Market: The Limpopo-Gauteng Corridor

### Why Start Here

Limpopo produces 350-400K tonnes of tomatoes annually [4]. Gauteng has 7,000-9,000 independent restaurants spending R6K-R15K per week on fresh produce [8]. The N1 highway connects them. And the price spread — R5.50/kg at the farm gate ballooning to R20-25/kg at the restaurant — is extreme enough to build a business in the gap [5].

### Selling to Restaurants

We target independent restaurants in Sandton, Rosebank, and Melrose — high density, price-sensitive, and fed up with unreliable suppliers.

The sales motion is simple:
1. WhatsApp message with a side-by-side price comparison
2. Field rep visits between 2-4 PM (the quiet window between services)
3. Chef-to-chef referrals with incentives
4. First order at cost — prove the quality, earn the relationship

### Onboarding Farmers

We partner with existing cooperatives — ZZ2, Mahela Fresh Produce, Limpopo Tomato Growers Association, Mogalakwena Cooperative [4]. A field agent based in Tzaneen handles onboarding. We start with surplus and second-grade produce to reduce farmer risk. The 48-hour payment pitch sells itself against 21-day market cycles.

### Launch Ramp

| Month | Cooperatives | Restaurants | Weekly Volume | Monthly Revenue |
|-------|-------------|-------------|---------------|-----------------|
| 1 | 3 | 15-20 | 5,000 kg | R80K |
| 2 | 5 | 50 | 10,000 kg | R160K |
| 3 | 8 | 80 | 15,000 kg | R240K+ |
| 4-6 | 10+ | 100+ | 20,000+ kg | R320K+ |

After proving the model on tomatoes, we expand: Mpumalanga corridor (subtropical fruit, potatoes), broader product range (avocados, peppers, citrus), and a pilot B2G municipal contract by month 10-12.

---

## 9. Operations

### Logistics — Asset-Light, Control-Heavy

We don't own trucks. We coordinate:

1. Cooperatives consolidate produce at existing collection points and cold rooms
2. Our field agent photographs and grades produce at collection
3. Contracted refrigerated transport runs 1-2 dedicated routes daily on the N1
4. Gauteng-side micro-hub handles last-mile sorting
5. Route-optimised delivery drops to restaurants (consolidated, not individual)

### Quality Without Touching the Product

This is a deliberate structural choice. By never physically handling produce, we avoid HACCP certification requirements [18]. Quality control happens through:
- Grading standards communicated to cooperatives
- Photo verification at collection
- Buyer ratings that create accountability
- 24-hour dispute resolution (refund or credit for quality failures)

### Payment Flow

All funds move through licensed Payment Service Providers (Stitch/Ozow) [17]. FarmConnect never holds customer money — this keeps us clear of National Payment System Act obligations. Buyers pay on delivery or 7-day terms. Farmers receive payment within 48 hours of confirmed delivery. We retain our commission in between.

---

## 10. Regulatory & Compliance

We've structured carefully to stay on the right side of SA regulation:

- **Company:** Pty Ltd under Companies Act 71 of 2008 [10]
- **Platform positioning:** Technology marketplace, NOT a market agent — avoids Agricultural Produce Agents Act licensing [12]
- **B-BBEE:** EME status gives automatic Level 4; ≥51% black ownership targets Level 1 [15]
- **Payments:** Licensed PSP handles all funds; FICA/KYC built into onboarding [17]
- **Data:** POPIA-compliant from day one — DPO appointed, consent management, privacy policy [13]
- **VAT:** Fresh produce is zero-rated; our service fees attract 15% VAT once turnover exceeds R1M [16]
- **Food safety:** No HACCP required since we don't touch produce [18]

**Total Year 1 compliance cost: R500K-R1.25M** — budgeted and non-negotiable.

The B-BBEE strategy is central, not cosmetic. Level 1 status opens government procurement. Smallholder onboarding counts as supplier development. Field agent training counts as skills development. The structure works commercially and politically.

---

## 11. Technology

### What's Built

| Layer | Stack |
|-------|-------|
| Backend | Express.js / TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React / Vite / TailwindCSS |

### What We Add for Corridor Launch

- Domain-specific data models (Farm, ProduceListing, Organization, Invoice)
- Payments via Ozow (instant EFT) and Stitch (account-to-account)
- WhatsApp/SMS notifications via Clickatell
- Photo storage on Cloudflare R2
- Async job processing with BullMQ + Redis

### Key Technical Principles

1. **Monolith until proven otherwise** — no premature microservices
2. **WhatsApp-first** — farmers don't download apps; they use WhatsApp
3. **Offline-capable** — intermittent connectivity is the norm in rural Limpopo, not the exception
4. **Manual before automated** — we'll run processes by hand until volume forces us to build software

---

## 12. Financial Projections

### Year 1 (Conservative)

| Quarter | Restaurants | Monthly GMV | Monthly Revenue |
|---------|------------|-------------|-----------------|
| Q1 | 20-50 | R200K-500K | R12K-30K |
| Q2 | 50-80 | R500K-800K | R30K-50K |
| Q3 | 80-120 | R800K-1.2M | R50K-80K |
| Q4 | 120-150 | R1.2M-1.5M | R80K-120K |

**Year 1 totals:** R50-100M GMV | R3-8M revenue | R8-12M operating costs | R5-9M net burn

### Year 2 (3-4 corridors + B2G pilot)
R200-500M GMV | R20-50M revenue | Burn narrowing to R5-15M

### Year 3 (Multi-province + government)
R500M-1.5B GMV | R50-150M revenue | Path to operating breakeven at ~R1B GMV

### What These Numbers Assume

- Successful fundraising (without capital, none of this happens)
- Year 2-3 depends heavily on winning government contracts
- If Year 1 unit economics don't work, we don't scale — full stop
- Timeline to profitability: 4-6 years, typical for marketplace businesses

---

## 13. Risks — The Honest Version

We'd rather tell you what keeps us up at night than pretend this is a sure thing.

### The Risks That Could Kill Us

**Disintermediation (HIGH probability, HIGH impact):** Buyers and sellers meet through our platform, then cut us out. This is the #1 killer of agricultural marketplaces. Our defence: we solve logistics, not just introductions. If you leave FarmConnect, you lose the cold chain, the route optimisation, the 48-hour farmer payments, and the quality grading. That's hard to replicate with a WhatsApp group.

**Unit economics death spiral (MEDIUM probability, CRITICAL impact):** Margins are thin. If logistics costs rise or volumes don't materialise, we bleed out. Defence: prove the corridor works before adding a second one. Never subsidise indefinitely. Volume-based logistics discounts improve margins over time.

**Incumbent response (MEDIUM probability, HIGH impact):** Khula! has Naspers money. Checkers has infrastructure. If they copy our model, we're in trouble. Defence: move fast on the government channel (harder to replicate without B-BBEE credentials), build deep cooperative relationships, and make switching painful through standing orders and procurement integration.

**Funding gap (MEDIUM probability, CRITICAL impact):** SA agritech attracted less than $30M in total VC in 2024 [7]. The money might not be there. Defence: lean corridor model reduces burn; blended funding strategy (grants + impact + VC) reduces dependency on any single source.

### The Sector-Level Truth

African agritech marketplaces fail at a rate of 70-85% within five years [7][20]. We assess our own probability of success at 15-25%.

The primary ways we die: running out of money before proving unit economics, trying to do too much too soon, or underestimating how hard it is to move physical goods reliably in South Africa.

### Our Operating Principles Against These Risks

1. **Prove before scaling** — one corridor must work before we touch a second
2. **Revenue before features** — manual processes are fine if they generate cash
3. **Logistics before matching** — anyone can build a marketplace app; moving 5 tonnes of tomatoes reliably is the moat
4. **Offline before online** — if it doesn't work on WhatsApp, it doesn't work

---

## 14. Team

### Who We Need to Hire Immediately

| Role | Monthly Cost | Why |
|------|-------------|-----|
| CEO / General Manager | R60-80K | Commercial leadership, fundraising |
| Head of Operations | R45-65K | Logistics coordination, corridor management |
| Field Agent (Limpopo-based) | R20-30K | Farmer onboarding, quality checks, collection |
| Sales Rep (Gauteng-based) | R25-35K + commission | Restaurant acquisition |
| Full-stack Developer | R50-70K | Platform development |

We scale the team as corridors scale: second field agent for Mpumalanga (Month 4), Head of Government Sales (Month 9), additional developers as transaction volume demands.

### Advisory Board Targets
- Agricultural cooperative leader (supply-side credibility)
- Restaurant industry veteran (demand-side insight)
- Government procurement specialist (B2G navigation)
- Agritech investor/operator (fundraising guidance)

---

## 15. The Ask

### Seed Round: R8-12M

| Use of Funds | Amount | Share |
|-------------|--------|-------|
| Team (12 months) | R3.5-5M | 40% |
| Technology development | R1.5-2M | 18% |
| Logistics & operations | R1.5-2M | 18% |
| Regulatory & compliance | R0.5-1.25M | 10% |
| Sales & marketing | R0.5-1M | 8% |
| Working capital (payment bridging) | R0.5-1M | 6% |

### How We Plan to Raise It

SA agritech VC is thin [7], so we pursue a blended strategy:
1. **Government grants (R2-5M):** DALRRD innovation fund, IDC early-stage, SEDA technology programme
2. **Impact investors (R3-5M):** Acumen, AgDevCo, Root Capital — aligned with smallholder inclusion
3. **Angel/VC (R3-5M):** SA-focused agritech angels and early-stage funds
4. **DFI co-investment (Year 2):** IFC, FMO, Norfund — once revenue traction is proven

### What You Get

- Equity stake (targeting 20-30% dilution at seed; terms negotiable)
- Board seat(s) for lead investor
- Quarterly reporting: GMV, unit economics, farmer/buyer metrics, impact data
- A front-row seat to either a category-defining SA agritech company or a well-documented, honest attempt at one

### Series A Triggers (Month 18-24, R30-50M)

We raise Series A when we can show:
1. Single corridor contribution-margin positive
2. 100+ restaurants ordering weekly
3. 10+ cooperatives supplying reliably
4. Stable, proven unit economics
5. Signed B2G pilot contract
6. R50M+ annualised GMV run rate

---

## 16. Sources

[1] DALRRD. *Agricultural Statistics Abstract 2024*. Pretoria: Government Printer.

[2] Statistics South Africa. *Manufacturing: Production and Sales Survey*. Various editions.

[3] National Treasury. *Budget Vote 16: Basic Education 2025/26*. Republic of South Africa.

[4] Johannesburg Fresh Produce Market. *Annual Report 2023/24*.

[5] National Agricultural Marketing Council (NAMC). *Food Price Monitoring Reports*. Various editions.

[6] Mastercard Foundation / FinMark Trust. *Spaza Shop Study 2023*.

[7] Disrupt Africa. *African Tech Startups Funding Reports 2023-2024*.

[8] Restaurant Association of South Africa (RASA). *Industry Estimates and Member Surveys*.

[9] Crunchbase. Funding data for Khula!, Twiga Foods, Aerobotics. Accessed 2025-2026.

[10] Republic of South Africa. *Companies Act 71 of 2008*.

[11] Republic of South Africa. *Agricultural Product Standards Act 119 of 1990*.

[12] Republic of South Africa. *Agricultural Produce Agents Act 12 of 1992*.

[13] Republic of South Africa. *Protection of Personal Information Act (POPIA) 4 of 2013*.

[14] Republic of South Africa. *National Credit Act 34 of 2005*.

[15] Republic of South Africa. *Broad-Based Black Economic Empowerment Act 53 of 2003*; AgriBEE Sector Code.

[16] Republic of South Africa. *Value-Added Tax Act 89 of 1991*.

[17] Republic of South Africa. *Financial Intelligence Centre Act (FICA) 38 of 2001*; *National Payment System Act 78 of 1998*.

[18] Republic of South Africa. *Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972*.

[19] Fresh Produce Exporters Forum (FPEF). *Logistics and Cold Chain Studies*. Various publications.

[20] TechCrunch / TechCabal / Ventureburn. Twiga Foods investor disclosures and SA agritech coverage. Various articles 2023-2026.

[21] National Fresh Produce Markets Information System. nfpm.co.za. Price data accessed 2025-2026.

[22] FPEF / DALRRD. Post-harvest loss estimates for South African fresh produce supply chains.

---

*This document contains forward-looking statements based on current market research and assumptions. Actual results may differ materially. All financial projections are estimates subject to market conditions, execution capability, and funding availability.*

---

**Prepared by:** FarmConnect SA  
**Contact:** [To be completed]  
**Date:** May 2026
