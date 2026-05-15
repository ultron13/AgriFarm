import { redis } from './redis';

const KEY = (userId: string) => `revoked:${userId}`;
const MAX_TOKEN_LIFETIME_SEC = 7 * 24 * 60 * 60; // must match JWT_EXPIRES_IN ceiling

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ]);
}

export async function revokeUserTokens(userId: string): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000);
  try {
    await withTimeout(redis.set(KEY(userId), String(cutoff), 'EX', MAX_TOKEN_LIFETIME_SEC), 300);
  } catch {
    // Best-effort — log but don't block sign-out when Redis is unavailable.
  }
}

export async function isTokenRevoked(userId: string, iat: number): Promise<boolean> {
  try {
    const cutoff = await withTimeout(redis.get(KEY(userId)), 300);
    // iat <= cutoff means the token was issued before or at the moment of revocation
    return cutoff !== null && iat <= Number(cutoff);
  } catch {
    // Fail open — a Redis outage must never lock authenticated users out of the API.
    return false;
  }
}
