# User Roles & Permissions

FarmConnect uses role-based access control (RBAC). Roles are assigned at registration and managed by admins. A user has exactly one role.

---

## Roles

| Role | Description |
|------|-------------|
| `FARMER` | Farmer or cooperative representative — lists produce, views payouts |
| `BUYER` | Restaurant, hotel, caterer, or government buyer — browses listings, places orders |
| `FIELD_AGENT` | Limpopo/Mpumalanga-based agent — performs quality checks, assists farmer onboarding |
| `LOGISTICS_COORDINATOR` | Manages routes, drivers, and delivery status updates |
| `SALES_REP` | Restaurant acquisition — can view buyer accounts, assist with onboarding |
| `ADMIN` | Full access to all operational data; can resolve disputes, trigger payouts |
| `SUPER_ADMIN` | System configuration, role management, feature flags |

---

## Permission Matrix

`✓` = allowed, `✗` = denied, `own` = own records only

| Resource / Action | FARMER | BUYER | FIELD_AGENT | LOGISTICS | SALES_REP | ADMIN | SUPER_ADMIN |
|-------------------|--------|-------|-------------|-----------|-----------|-------|-------------|
| **Listings** | | | | | | | |
| Create listing | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Read listings | own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update listing | own | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Delete listing | own | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Orders** | | | | | | | |
| Place order | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| View orders | own | own | assigned | all | all | all | all |
| Update order status | ✗ | limited | limited | ✓ | ✗ | ✓ | ✓ |
| Cancel order | ✗ | own* | ✗ | ✗ | ✗ | ✓ | ✓ |
| Confirm delivery | ✗ | own | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Quality Checks** | | | | | | | |
| Submit quality check | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| View quality checks | own** | own | own | all | ✗ | all | all |
| Dispute quality | ✗ | own | ✗ | ✗ | ✗ | ✓ | ✓ |
| Resolve dispute | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Payments & Payouts** | | | | | | | |
| Initiate payment | ✗ | own | ✗ | ✗ | ✗ | ✓ | ✓ |
| View payment status | ✗ | own | ✗ | ✗ | ✗ | all | all |
| View payouts | own | ✗ | ✗ | ✗ | ✗ | all | all |
| Trigger manual payout | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Farmers** | | | | | | | |
| View farmer profiles | own | ✗ | assigned | ✗ | all | all | all |
| Update farmer profile | own | ✗ | assigned | ✗ | ✗ | ✓ | ✓ |
| Approve FICA | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Buyers** | | | | | | | |
| View buyer profiles | ✗ | own | ✗ | ✗ | all | all | all |
| Update buyer profile | ✗ | own | ✗ | ✗ | ✗ | ✓ | ✓ |
| Set credit limit | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Logistics** | | | | | | | |
| View routes | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Manage routes | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Assign deliveries | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Reporting** | | | | | | | |
| GMV / unit economics | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| B-BBEE report | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Admin** | | | | | | | |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage feature flags | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| View audit logs | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

\* Pre-dispatch only (status PENDING or CONFIRMED)  
\** Farmers see quality checks for their own orders

---

## Implementation

Roles are stored on the `User` model and included in the JWT payload:

```typescript
// JWT payload
interface JwtPayload {
  sub: string;    // userId
  role: UserRole;
  iat: number;
  exp: number;
}
```

Middleware enforces role checks at the route level:

```typescript
// Example route guard
router.patch('/orders/:id/status',
  authenticate,
  requireRole(['ADMIN', 'LOGISTICS_COORDINATOR', 'FIELD_AGENT', 'BUYER']),
  validateOrderStatusTransition,
  updateOrderStatus
);
```

Field-level filtering (e.g., farmers see only their own records) is applied in the service layer, not the route layer, to avoid accidental bypass.

---

## Sensitive Operations Requiring Audit Log

Every action in this list must write to the `AuditLog` table with: `userId`, `action`, `resourceType`, `resourceId`, `before` (JSON), `after` (JSON), `ip`, `timestamp`.

- Any order status change
- Payout triggered or retried
- Payment refunded
- FICA documents approved or rejected
- Credit limit changed
- Quality dispute resolved
- Feature flag toggled
- User role changed
- User deactivated
