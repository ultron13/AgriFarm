# Staging Setup — Fly.io

One-time steps to provision the staging environment.
After this, every push to `main` that passes CI deploys automatically.

---

## Prerequisites

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Log in
fly auth login
```

---

## 1. Create the apps

```bash
# Backend
fly apps create farmconnect-api --org personal

# Frontend
fly apps create farmconnect-web --org personal
```

If `farmconnect-api` / `farmconnect-web` are taken, choose different names and
update `app =` in `backend/fly.toml` and `frontend/fly.toml`.

---

## 2. Provision Postgres

```bash
fly postgres create \
  --name farmconnect-db \
  --region jnb \
  --vm-size shared-cpu-1x \
  --volume-size 1 \
  --org personal

# Attach to the backend app — this sets DATABASE_URL automatically
fly postgres attach farmconnect-db --app farmconnect-api
```

---

## 3. Provision Redis (Upstash)

```bash
fly ext upstash redis create \
  --name farmconnect-redis \
  --region jnb

# Note the REDIS_URL printed — you'll need it in step 4
```

---

## 4. Set backend secrets

```bash
fly secrets set \
  --app farmconnect-api \
  JWT_SECRET="$(openssl rand -hex 32)" \
  REDIS_URL="rediss://..." \
  NODE_ENV="production" \
  FRONTEND_URL="https://farmconnect-web.fly.dev" \
  API_URL="https://farmconnect-api.fly.dev"

# PSP keys (leave blank to keep mock mode)
fly secrets set --app farmconnect-api \
  OZOW_SITE_CODE="" \
  OZOW_PRIVATE_KEY="" \
  OZOW_WEBHOOK_SECRET="" \
  STITCH_CLIENT_ID="" \
  STITCH_CLIENT_SECRET="" \
  STITCH_WEBHOOK_SECRET=""

# Cloudflare R2 (leave blank to keep mock mode)
fly secrets set --app farmconnect-api \
  R2_ACCOUNT_ID="" \
  R2_ACCESS_KEY_ID="" \
  R2_SECRET_ACCESS_KEY="" \
  R2_BUCKET_NAME="" \
  R2_PUBLIC_URL=""

# WhatsApp (leave blank to disable)
fly secrets set --app farmconnect-api \
  WHATSAPP_WEBHOOK_TOKEN=""
```

---

## 5. Set frontend secrets

```bash
fly secrets set \
  --app farmconnect-web \
  BACKEND_URL="http://farmconnect-api.internal:3000"
```

---

## 6. Seed demo data (first deploy only)

After the first backend deploy completes:

```bash
fly ssh console --app farmconnect-api \
  --command "npx tsx prisma/demo-seed.ts"
```

---

## 7. Add GitHub Actions secret

In your GitHub repo → **Settings → Secrets and variables → Actions**:

| Name | Value |
|------|-------|
| `FLY_API_TOKEN` | Output of `fly auth token` |

---

## 8. Deploy

Push to `main`. GitHub Actions will:

1. Run backend lint + typecheck + tests
2. Build backend Docker image
3. **Deploy backend to Fly.io** (runs `prisma migrate deploy` as the release command)
4. Run frontend typecheck + build
5. Build frontend Docker image
6. **Deploy frontend to Fly.io**

Staging URLs (after first deploy):
- Frontend: `https://farmconnect-web.fly.dev`
- Backend API: `https://farmconnect-api.fly.dev`
- Health check: `https://farmconnect-api.fly.dev/health`

---

## Useful commands

```bash
# Tail logs
fly logs --app farmconnect-api
fly logs --app farmconnect-web

# Open a console on the backend
fly ssh console --app farmconnect-api

# Scale to zero when not in use
fly scale count 0 --app farmconnect-api
fly scale count 0 --app farmconnect-web
```
