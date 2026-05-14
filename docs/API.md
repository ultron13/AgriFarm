# API Specification

Base URL: `https://api.farmconnect.co.za/v1`  
Auth: `Authorization: Bearer <jwt>`  
Content-Type: `application/json`

All responses follow:
```json
{
  "data": {},
  "meta": { "page": 1, "perPage": 20, "total": 100 },
  "error": null
}
```
Error responses: `{ "data": null, "error": { "code": "...", "message": "..." } }`

---

## Authentication

### POST /auth/register
Register a new user (farmer or buyer).

**Body:**
```json
{
  "email": "farmer@example.com",
  "phone": "+27723456789",
  "password": "...",
  "role": "FARMER",
  "displayName": "Mahela Cooperative"
}
```

**Response 201:**
```json
{
  "data": {
    "userId": "uuid",
    "token": "jwt",
    "role": "FARMER"
  }
}
```

### POST /auth/login
```json
{ "email": "...", "password": "..." }
```

### POST /auth/refresh
```json
{ "refreshToken": "..." }
```

### POST /auth/whatsapp-login
Initiate OTP-based login for WhatsApp users.
```json
{ "phone": "+27723456789" }
```

---

## Farmers

### GET /farmers
List farmers (Admin/Sales Rep only).  
Query: `?province=LIMPOPO&isSmallholder=true&page=1&perPage=20`

### GET /farmers/:id
Get farmer profile.

### POST /farmers
Create farmer profile (linked to authenticated user).
```json
{
  "displayName": "ZZ2 Farm — Unit 4",
  "province": "LIMPOPO",
  "district": "Tzaneen",
  "gpsLat": -23.833,
  "gpsLng": 30.175,
  "organizationId": "uuid",
  "isSmallholder": false
}
```

### PATCH /farmers/:id
Update farmer profile. Returns updated farmer.

### POST /farmers/:id/bank-account
Register bank account via PSP tokenisation (never stored in our DB).
```json
{ "pspToken": "stitch-account-token" }
```

---

## Produce Listings

### GET /listings
Browse available produce listings.  
Query: `?product=tomatoes&province=LIMPOPO&minKg=100&availableFrom=2026-05-20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product": { "name": "Tomatoes (Round)", "category": "VEGETABLES" },
      "farmer": { "displayName": "Mahela Cooperative", "province": "LIMPOPO" },
      "farmGatePrice": 5.50,
      "availableKg": 2000,
      "minimumOrderKg": 100,
      "availableFrom": "2026-05-20",
      "availableUntil": "2026-05-27",
      "grade": "B",
      "photos": ["https://r2.farmconnect.co.za/..."]
    }
  ]
}
```

### POST /listings
Create a new produce listing (Farmer only).
```json
{
  "productId": "uuid",
  "farmGatePrice": 5.50,
  "availableKg": 2000,
  "minimumOrderKg": 100,
  "availableFrom": "2026-05-20T00:00:00Z",
  "availableUntil": "2026-05-27T00:00:00Z"
}
```

### PATCH /listings/:id
Update listing (price, volume, status).

### DELETE /listings/:id
Soft-delete listing (Farmer or Admin).

### POST /listings/:id/photos
Upload produce photos. Content-Type: `multipart/form-data`.  
Returns signed Cloudflare R2 URLs.

---

## Orders

### GET /orders
List orders for authenticated user.  
Query: `?status=CONFIRMED&page=1&perPage=20`

Buyers see their own orders. Farmers see orders containing their listings. Admins see all.

### GET /orders/:id
Get full order detail including items, delivery, payment status.

### POST /orders
Place a new order (Buyer only).
```json
{
  "items": [
    { "listingId": "uuid", "quantityKg": 200 }
  ],
  "deliveryDate": "2026-05-22",
  "notes": "Deliver before 07:00 AM",
  "source": "WEB"
}
```

**Response 201:**
```json
{
  "data": {
    "orderId": "uuid",
    "orderNumber": "FC-2026-000042",
    "status": "PENDING",
    "deliveredPrice": 3200.00,
    "paymentDueDate": "2026-05-29"
  }
}
```

### PATCH /orders/:id/status
Update order status (role-restricted state machine).

| Current | Next | Who |
|---------|------|-----|
| PENDING | CONFIRMED | Admin / Logistics |
| CONFIRMED | QUALITY_CHECKED | Field Agent |
| QUALITY_CHECKED | IN_TRANSIT | Logistics Coordinator |
| IN_TRANSIT | AT_HUB | Logistics Coordinator |
| AT_HUB | OUT_FOR_DELIVERY | Logistics Coordinator |
| OUT_FOR_DELIVERY | DELIVERED | Driver / Buyer confirmation |
| Any | CANCELLED | Admin / Buyer (pre-dispatch) |
| DELIVERED | DISPUTED | Buyer (within 24 hrs) |

### POST /orders/:id/confirm-delivery
Buyer confirms receipt. Triggers 48hr farmer payout clock.
```json
{ "proofOfDeliveryPhoto": "base64-or-upload-ref" }
```

---

## Quality Checks

### POST /quality-checks
Field agent submits quality check at collection point.
```json
{
  "orderId": "uuid",
  "farmerId": "uuid",
  "gradeAwarded": "B",
  "quantityKg": 195.5,
  "rejectedKg": 4.5,
  "notes": "Minor surface blemishes on 2% of load — within grade B tolerance",
  "photos": ["upload-ref-1", "upload-ref-2"]
}
```

### GET /quality-checks/:orderId
Get quality check for an order.

### POST /quality-checks/:id/dispute
Buyer disputes quality after delivery.
```json
{
  "reason": "Delivered tomatoes show signs of cold-chain break — significant bruising",
  "photos": ["upload-ref"]
}
```
Auto-creates a 24-hour resolution window. Admin mediates.

---

## Logistics

### GET /routes
List logistics routes (Admin / Logistics Coordinator).

### GET /routes/:id/deliveries
List deliveries scheduled on a route for a given date.  
Query: `?date=2026-05-22`

### POST /deliveries
Schedule a delivery for an order.
```json
{
  "orderId": "uuid",
  "routeId": "uuid",
  "vehicleRef": "RT-LIM-004",
  "driverName": "Johannes Sithole",
  "driverPhone": "+27821234567"
}
```

### PATCH /deliveries/:id
Update delivery status, add tracking URL or proof of delivery.

---

## Payments

### POST /payments/initiate
Initiate buyer payment for an order.
```json
{
  "orderId": "uuid",
  "method": "INSTANT_EFT"
}
```
Returns PSP redirect URL or payment instructions.

### GET /payments/:orderId
Get payment status for an order.

### POST /webhooks/ozow
Ozow payment webhook (no auth header — verified by HMAC).

### POST /webhooks/stitch
Stitch account-to-account webhook.

---

## Payouts

### GET /payouts
List payouts (Farmer sees own; Admin sees all).  
Query: `?status=PENDING&farmerId=uuid`

### GET /payouts/:id
Get payout detail.

### POST /payouts/:id/retry
Retry a failed payout (Admin only).

---

## Invoices

### GET /invoices/:orderId
Get invoice for an order. Returns invoice metadata + PDF URL.

### POST /invoices/:orderId/send
Email invoice to buyer (Admin / system-triggered).

---

## Reporting (Admin only)

### GET /reports/gmv
```
Query: ?from=2026-05-01&to=2026-05-31&corridor=LIMPOPO_GAUTENG
```
Returns daily GMV, order count, average order value.

### GET /reports/unit-economics
Corridor-level P&L: revenue, logistics costs, commissions, net margin.

### GET /reports/bbbee
B-BBEE impact metrics: smallholder spend, skills development hours, supplier diversity.

### GET /reports/farmers
Farmer performance: volume supplied, payout totals, quality grade distribution.

---

## WhatsApp Webhook

### POST /webhooks/whatsapp
Clickatell inbound webhook — processes incoming buyer orders via WhatsApp.

The WhatsApp order flow:
1. Buyer sends: "order 200kg tomatoes for Thursday"
2. System replies with listing options and prices
3. Buyer confirms
4. Order created with `source: WHATSAPP`
5. Buyer receives order number and delivery ETA via WhatsApp
