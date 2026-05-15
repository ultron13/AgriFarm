// Defer secret validation to first use — module-level throws fail CF bundle validation
// because secrets are not yet injected during the startup sandbox check.
export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET env var is required');
  }
  return s ?? 'test-secret';
}
