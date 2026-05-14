# FarmConnect SA

A logistics-enabled B2B agricultural marketplace connecting Limpopo farmers directly to Gauteng restaurants, hotels, caterers, and government buyers — cutting out the middlemen that absorb 40-55% of farm-gate value.

**Status:** MVP built — pre-revenue, seeking seed funding (R8-12M)  
**Stack:** Express.js / TypeScript · PostgreSQL / Prisma · React / Vite / TailwindCSS

---

## The Problem We Solve

A tomato leaves a Limpopo farm at R5.50/kg. It arrives at a Sandton restaurant at R20-25/kg. The farmer didn't get richer. The chef didn't get a better tomato. FarmConnect cuts that spread — delivering at R16/kg while paying farmers within 48 hours.

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, services, and infrastructure |
| [Data Models](docs/DATA_MODELS.md) | Database schema and entity relationships |
| [API Specification](docs/API.md) | REST API endpoints and contracts |
| [Features](docs/FEATURES.md) | Feature specifications by user segment |
| [User Roles & Permissions](docs/USER_ROLES.md) | RBAC model |
| [Logistics](docs/LOGISTICS.md) | Supply chain and delivery operations |
| [Payments](docs/PAYMENTS.md) | Payment flows, PSP integrations, and farmer payouts |
| [Compliance](docs/COMPLIANCE.md) | Regulatory framework: POPIA, B-BBEE, VAT, payments |
| [Tech Stack](docs/TECH_STACK.md) | Dependencies, services, and tooling decisions |
| [Roadmap](docs/ROADMAP.md) | Development milestones and corridor launch plan |
| [Environment Setup](docs/ENVIRONMENT.md) | Local dev setup and environment variables |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Project Structure

```
farmconnect/
├── backend/          # Express.js / TypeScript API
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── services/ # Business logic
│   │   ├── jobs/     # BullMQ async jobs
│   │   └── middleware/
├── frontend/         # React / Vite / TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
├── prisma/           # Database schema and migrations
└── docs/             # Project documentation
```

## Business Model

| Revenue Stream | Rate | Applied To |
|---------------|------|-----------|
| Buyer commission | 8% | Delivered order value |
| Seller commission | 5% | Farm-gate value |
| **Blended take rate** | **~10-11%** | **Total GMV** |

Corridor breakeven: 25-30 restaurants ordering weekly (~54,400 kg/month), achievable within 3-4 months of launch.
