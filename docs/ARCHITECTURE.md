# System Architecture

## Overview

FarmConnect SA is built as a **monolith-first** application. We do not prematurely decompose into microservices — the operational complexity is not justified until we have proven corridor unit economics and have > R50M GMV/year. The system is designed so boundaries are clean enough to extract services later without a rewrite.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  React Web App  │  │  WhatsApp    │  │  Field Agent App   │  │
│  │  (Vite/Tailwind)│  │  (Clickatell)│  │  (PWA / mobile)   │  │
│  └────────┬────────┘  └──────┬───────┘  └─────────┬──────────┘  │
└───────────┼─────────────────┼───────────────────  ┼─────────────┘
            │                 │                      │
            ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│              Express.js / TypeScript (REST)                      │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │  Auth    │ │  Listings  │ │   Orders    │ │  Logistics   │  │
│  │  Router  │ │  Router    │ │   Router    │ │  Router      │  │
│  └──────────┘ └────────────┘ └─────────────┘ └──────────────┘  │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Payments │ │  Quality   │ │  Reporting  │ │  Webhooks    │  │
│  │  Router  │ │  Router    │ │   Router    │ │  Router      │  │
│  └──────────┘ └────────────┘ └─────────────┘ └──────────────┘  │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐   ┌────────────────┐
│   PostgreSQL    │    │   Redis + BullMQ    │   │ Cloudflare R2  │
│   (Prisma ORM)  │    │   (Job Queue)       │   │ (Photo storage)│
└─────────────────┘    └─────────────────────┘   └────────────────┘

            ┌───────────────────────┬───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐   ┌────────────────┐
│  Ozow / Stitch  │    │    Clickatell        │   │  SendGrid      │
│  (Payments PSP) │    │  (WhatsApp / SMS)    │   │  (Email)       │
└─────────────────┘    └─────────────────────┘   └────────────────┘
```

## Architectural Principles

1. **Monolith until proven otherwise** — single deployable unit; clean module boundaries that can be extracted later
2. **WhatsApp-first** — every buyer/farmer-facing flow must work over WhatsApp; the web app is a bonus
3. **Offline-capable** — field agents operate in rural Limpopo with intermittent connectivity; local-first PWA with sync
4. **Manual before automated** — a process runs manually until volume justifies automation; software is the last resort, not the first

## Services and Modules

### Core Application (Express.js)

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT-based auth, role management, FICA/KYC onboarding |
| `farmers` | Farmer and cooperative profiles, onboarding flows |
| `listings` | Produce listings, availability, pricing |
| `orders` | Order placement, lifecycle management, status tracking |
| `logistics` | Route planning, delivery assignment, tracking |
| `quality` | Photo submission, grading workflows, dispute resolution |
| `payments` | PSP integration, payout scheduling, commission ledger |
| `notifications` | WhatsApp, SMS, email dispatch via BullMQ jobs |
| `reporting` | GMV dashboards, unit economics, B-BBEE impact metrics |
| `compliance` | Invoice generation, B-BBEE certificates, audit trails |

### Async Job Queue (BullMQ + Redis)

| Queue | Jobs |
|-------|------|
| `payments` | Farmer payout triggers (48hr after delivery confirmation) |
| `notifications` | WhatsApp/SMS/email dispatch |
| `quality` | Photo processing, grading score calculation |
| `reporting` | Nightly GMV and unit economics snapshots |
| `compliance` | Invoice PDF generation, B-BBEE report generation |

## Deployment Architecture

### Target: Single VPS → Managed Cloud (Month 4+)

**Phase 1 (Launch):** Single VPS (DigitalOcean / Hetzner)
- Docker Compose: API + PostgreSQL + Redis + Nginx
- Cloudflare CDN for frontend static assets
- Managed PostgreSQL once volume warrants it

**Phase 2 (Scale — after corridor breakeven):**
- Railway / Render for managed app hosting
- Supabase or Neon for managed PostgreSQL
- Upstash for managed Redis

## Security Architecture

- All API routes require JWT authentication (except `/auth/*` and PSP webhooks)
- Role-based access control enforced at middleware layer (see [User Roles](USER_ROLES.md))
- PSP webhooks verified by HMAC signature before processing
- All PII encrypted at rest (POPIA requirement — see [Compliance](COMPLIANCE.md))
- Secrets managed via environment variables; never committed to VCS
- HTTPS enforced everywhere; HTTP redirects to HTTPS

## Data Flow: Order Lifecycle

```
Buyer places order (WhatsApp / Web)
        │
        ▼
Order created → status: PENDING
        │
        ▼
Farmer / cooperative notified (WhatsApp)
        │
        ▼
Field agent photographs & grades produce
        │
        ▼
Order confirmed → status: CONFIRMED
        │
        ▼
Refrigerated transport dispatched (N1 corridor)
        │
        ▼
Gauteng micro-hub receives & sorts
        │
        ▼
Last-mile delivery to restaurant
        │
        ▼
Buyer confirms receipt → status: DELIVERED
        │
        ├──► Buyer invoice generated (PDF)
        │
        └──► Farmer payout queued (48hr window)
                    │
                    ▼
             Stitch / Ozow EFT → Farmer bank account
```
