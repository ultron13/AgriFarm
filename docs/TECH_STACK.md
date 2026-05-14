# Technology Stack

## Guiding Principles

1. **Monolith until proven otherwise** — no premature microservices
2. **WhatsApp-first** — every buyer/farmer flow must work on WhatsApp
3. **Offline-capable** — field agents operate in rural Limpopo with intermittent connectivity
4. **Manual before automated** — run processes by hand until volume forces software

---

## Current Stack (MVP Built)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Backend runtime | Node.js | 20 LTS | |
| Backend framework | Express.js | 4.x | |
| Language | TypeScript | 5.x | Strict mode |
| ORM | Prisma | 5.x | Schema-first |
| Database | PostgreSQL | 16 | |
| Frontend framework | React | 18 | |
| Frontend build | Vite | 5.x | |
| Frontend styling | TailwindCSS | 3.x | |

---

## Added for Corridor Launch

### Payments

| Service | Purpose | Docs |
|---------|---------|------|
| **Ozow** | Instant EFT — buyer pays immediately | ozow.com/api |
| **Stitch** | Account-to-account — payment terms, farmer payouts | stitch.money/docs |

Integration pattern: webhook-driven, never synchronous. PSP redirects buyer to hosted payment page; we receive webhooks on completion.

### Messaging & Notifications

| Service | Purpose |
|---------|---------|
| **Clickatell** | WhatsApp Business API — order placement, status updates, farmer payouts |
| **Clickatell SMS** | Fallback for users without WhatsApp |
| **SendGrid** | Transactional email — invoices, registration, admin alerts |

### Storage

| Service | Purpose |
|---------|---------|
| **Cloudflare R2** | Photo storage — quality check photos, listing photos, invoice PDFs |

R2 is S3-compatible. All uploads go through a signed URL flow — frontend never has direct write access.

### Job Processing

| Service | Purpose |
|---------|---------|
| **Redis** | BullMQ backing store |
| **BullMQ** | Async job queues — payouts, notifications, invoice generation, reporting |

### Monitoring

| Service | Purpose |
|---------|---------|
| **Sentry** | Error tracking (backend + frontend) |
| **Pino** | Structured JSON logging (backend) |
| **Uptime Robot** | Basic uptime monitoring |

---

## Infrastructure

### Phase 1 (Launch): Docker Compose on VPS

```yaml
# docker-compose.yml (overview)
services:
  api:
    build: ./backend
    env_file: .env
    depends_on: [postgres, redis]
    
  web:
    build: ./frontend
    # Static files served via Nginx or Cloudflare Pages
    
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    
  worker:
    build: ./backend
    command: npm run worker
    depends_on: [postgres, redis]
    
  nginx:
    image: nginx:alpine
    # Reverse proxy: / → web, /api → api, /webhooks → api
```

**Hosting:** Hetzner CX31 (4 vCPU, 8GB RAM, €10/month) or DigitalOcean Droplet  
**Domain:** farmconnect.co.za via Cloudflare (DNS + DDoS protection)  
**SSL:** Cloudflare proxied (free)

### Phase 2 (Post-Breakeven): Managed Services

| Current | Migration Target | Trigger |
|---------|-----------------|---------|
| Self-hosted Postgres | Supabase / Neon | > R50M GMV / operational load |
| Self-hosted Redis | Upstash | > R50M GMV |
| VPS Docker | Railway / Render | Team grows beyond 2 devs |
| Nginx | Cloudflare Workers | Only if edge logic needed |

---

## Development Environment

### Requirements

- Node.js 20 LTS
- Docker & Docker Compose
- PostgreSQL client (psql or TablePlus)

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://farmconnect:password@localhost:5432/farmconnect_dev

# Auth
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# PSP — Ozow
OZOW_SITE_CODE=
OZOW_PRIVATE_KEY=
OZOW_WEBHOOK_SECRET=

# PSP — Stitch
STITCH_CLIENT_ID=
STITCH_CLIENT_SECRET=
STITCH_WEBHOOK_SECRET=

# WhatsApp — Clickatell
CLICKATELL_API_KEY=
CLICKATELL_WHATSAPP_NUMBER=

# Email — SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=no-reply@farmconnect.co.za

# Storage — Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=farmconnect-prod
R2_PUBLIC_URL=https://assets.farmconnect.co.za

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## Code Conventions

### Backend (Express / TypeScript)

```
backend/src/
├── routes/          # Route handlers — thin, delegate to services
├── services/        # Business logic — testable, no HTTP concepts
├── jobs/            # BullMQ job processors
├── middleware/      # Auth, role check, error handling, request validation
├── lib/             # PSP clients, Clickatell client, R2 client
└── types/           # Shared TypeScript types
```

- Routes validate input with `zod`; reject bad requests before reaching services
- Services are pure functions or classes — no `req`/`res` objects
- All database access goes through Prisma; no raw SQL in service code
- BullMQ jobs are idempotent — safe to retry on failure

### Frontend (React / Vite / TailwindCSS)

```
frontend/src/
├── pages/           # Route-level page components
├── components/      # Shared UI components
├── hooks/           # Custom React hooks (data fetching, form state)
├── lib/             # API client, auth helpers
└── types/           # Shared TypeScript types (synced with backend)
```

- `react-query` (TanStack Query) for server state
- `react-hook-form` + `zod` for form validation
- TailwindCSS only — no CSS files
- Mobile-first design (field agents use phones)

### Testing

| Type | Tool | Coverage target |
|------|------|----------------|
| Unit (services) | Vitest | Core payment and order logic |
| Integration (API) | Supertest + Vitest | Happy path + auth |
| E2E | Playwright | Critical buyer and farmer flows |

Run tests: `npm test`  
E2E requires Docker Compose running: `npm run test:e2e`

---

## WhatsApp Integration (Clickatell)

### Inbound (Buyer → Platform)

1. Buyer sends message to FarmConnect WhatsApp number
2. Clickatell forwards to `POST /webhooks/whatsapp`
3. Webhook handler extracts phone number and message text
4. State machine interprets message in context of buyer's active conversation state
5. Platform replies via Clickatell outbound API

### Conversation State Machine

```
IDLE → BROWSING (on "order" keyword)
     → SELECTING_PRODUCT
     → SELECTING_QUANTITY
     → CONFIRMING_ORDER
     → ORDER_PLACED → IDLE
```

State persisted in Redis with 30-minute TTL (conversation expires if buyer goes quiet).

### Outbound Notifications

All notifications sent via BullMQ `notifications` queue:

```typescript
interface WhatsappNotification {
  to: string;         // E.164 phone number
  templateId: string; // Pre-approved Clickatell template
  variables: Record<string, string>;
}
```

WhatsApp Business API requires pre-approved message templates for outbound messages. Template approval: allow 5-7 business days. Templates needed at launch:
- `order_confirmed` — order number, items, delivery date
- `order_dispatched` — order in transit, estimated arrival
- `order_delivered` — delivery confirmed, invoice attached
- `payout_processed` — net amount, reference number
- `quality_dispute_resolved` — resolution type, credit/refund amount
