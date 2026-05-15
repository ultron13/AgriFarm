import { redis } from './redis';

const KEY = (userId: string) => `revoked:${userId}`;
const MAX_TOKEN_LIFETIME_SEC = 7 * 24 * 60 * 60; // must match JWT_EXPIRES_IN ceiling

export async function revokeUserTokens(userId: string): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000);
  await redis.set(KEY(userId), String(cutoff), 'EX', MAX_TOKEN_LIFETIME_SEC);
}

export async function isTokenRevoked(userId: string, iat: number): Promise<boolean> {
  try {
    const cutoff = await redis.get(KEY(userId));
    // iat <= cutoff means the token was issued before or at the moment of revocation
    return cutoff !== null && iat <= Number(cutoff);
  } catch {
    // Fail open — a Redis outage must never lock authenticated users out of the API.
    return false;
  }
}
