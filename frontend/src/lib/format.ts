import type { Order } from '@/types';

/**
 * Sum of farmGatePrice × quantityKg across all items on an order.
 * Values may arrive as strings (Prisma Decimal) so we coerce with Number().
 */
export function farmGateTotal(order: Pick<Order, 'items'>): number {
  return order.items.reduce(
    (sum, item) => sum + Number(item.farmGatePrice) * Number(item.quantityKg),
    0
  );
}

/**
 * Build a URL query string from a record of values.
 * Skips entries that are undefined, null, or empty strings.
 * Returns either `?key=value&...` or `''` (never a bare `?`).
 */
export function qs(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
