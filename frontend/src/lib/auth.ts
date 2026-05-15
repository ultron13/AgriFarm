import type { AuthUser } from '@/types';

const USER_KEY = 'fc_user';

export function saveAuth(auth: AuthUser): void {
  // Store only non-sensitive identity info. The JWT lives in the httpOnly cookie
  // set by the server — never in localStorage.
  localStorage.setItem(USER_KEY, JSON.stringify({ userId: auth.userId, role: auth.role }));
}

export function getAuth(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
