# Environment Setup

## Prerequisites

- Node.js 20 LTS (`nvm install 20 && nvm use 20`)
- Docker & Docker Compose
- Git

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/farmconnect-sa/farmconnect.git
cd farmconnect
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your local values. For local dev, only these are required to start:

```env
DATABASE_URL=postgresql://farmconnect:farmconnect@localhost:5432/farmconnect_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-change-in-prod
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Third-party services (Ozow, Stitch, Clickatell, SendGrid, R2) can be omitted locally — the relevant modules fail gracefully in development mode.

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate dev
npx prisma db seed     # seeds products, grade standards, admin user
```

### 5. Start development servers

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Background job worker
cd backend && npm run worker

# Terminal 3 — Frontend
cd frontend && npm run dev
```

API: http://localhost:3000  
Frontend: http://localhost:5173  
Prisma Studio: `npx prisma studio` → http://localhost:5555

---

## Environment Variables Reference

### Required (all environments)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | HS256 signing secret — min 32 chars in production |
| `JWT_EXPIRES_IN` | JWT TTL e.g. `7d` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL e.g. `30d` |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | API server port (default: 3000) |
| `FRONTEND_URL` | CORS allowed origin |

### Ozow (buyer payments)

| Variable | Description |
|----------|-------------|
| `OZOW_SITE_CODE` | Merchant site code from Ozow dashboard |
| `OZOW_PRIVATE_KEY` | Ozow private API key |
| `OZOW_WEBHOOK_SECRET` | Secret for HMAC webhook verification |
| `OZOW_IS_TEST` | `true` for sandbox, `false` for production |

### Stitch (account-to-account & payouts)

| Variable | Description |
|----------|-------------|
| `STITCH_CLIENT_ID` | OAuth client ID |
| `STITCH_CLIENT_SECRET` | OAuth client secret |
| `STITCH_WEBHOOK_SECRET` | Webhook signing secret |

### Clickatell (WhatsApp / SMS)

| Variable | Description |
|----------|-------------|
| `CLICKATELL_API_KEY` | One-API key |
| `CLICKATELL_WHATSAPP_NUMBER` | FarmConnect WhatsApp Business number |

### SendGrid (email)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |
| `SENDGRID_FROM_NAME` | Display name e.g. `FarmConnect SA` |

### Cloudflare R2 (photo and file storage)

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET_NAME` | Bucket name e.g. `farmconnect-prod` |
| `R2_PUBLIC_URL` | Public base URL for assets |

### Monitoring (production)

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry project DSN |

---

## Docker Compose (Production)

```yaml
# docker-compose.prod.yml
services:
  api:
    image: farmconnect-api:latest
    restart: always
    env_file: .env.prod
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    image: farmconnect-api:latest
    command: ["node", "dist/worker.js"]
    restart: always
    env_file: .env.prod
    depends_on:
      - redis
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: farmconnect
      POSTGRES_USER: farmconnect
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "farmconnect"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro

volumes:
  pgdata:
  redisdata:
```

---

## Deployment (Manual — Phase 1)

```bash
# On the VPS
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run migrations (never auto-migrate in production)
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

CI/CD (GitHub Actions) is set up in Phase 2 once the team grows beyond one developer.

---

## Database Backup

```bash
# Daily backup script (add to cron on VPS)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec postgres pg_dump -U farmconnect farmconnect | \
  gzip > /backups/farmconnect_${DATE}.sql.gz

# Upload to R2
rclone copy /backups/farmconnect_${DATE}.sql.gz r2:farmconnect-backups/
```

Retain 30 days of daily backups. Test restore monthly.
