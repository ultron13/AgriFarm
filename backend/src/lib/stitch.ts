import crypto from 'crypto';
import { logger } from './logger';
import { redis } from './redis';

const CLIENT_ID = process.env.STITCH_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.STITCH_CLIENT_SECRET ?? '';
const WEBHOOK_SECRET = process.env.STITCH_WEBHOOK_SECRET ?? '';

if (CLIENT_ID && !WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('STITCH_WEBHOOK_SECRET env var is required in production when STITCH_CLIENT_ID is set');
}
const BASE_URL = 'https://api.stitch.money';

const TOKEN_KEY = 'stitch:access_token';

async function getAccessToken(): Promise<string> {
  const cached = await redis.get(TOKEN_KEY);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'client_paymentrequest',
      audience: 'https://api.stitch.money',
    }),
  });

  const data = await res.json() as { access_token: string; expires_in: number };
  // Store with TTL 60s less than expiry so the token is never served stale
  const ttl = Math.max(data.expires_in - 60, 30);
  await redis.set(TOKEN_KEY, data.access_token, 'EX', ttl);
  return data.access_token;
}

export interface StitchPayoutRequest {
  reference: string;
  amount: number;
  currency: string;
  beneficiaryAccountRef: string; // PSP-tokenised account
  beneficiaryName: string;
}

export async function initiatePayout(req: StitchPayoutRequest): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    logger.warn('Stitch credentials not configured — skipping payout');
    return 'mock-psp-ref';
  }

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      query: `mutation CreatePayout($input: CreatePayoutInput!) {
        createPayout(input: $input) { payout { id status } }
      }`,
      variables: {
        input: {
          amount: { quantity: (req.amount * 100).toFixed(0), currency: req.currency },
          reference: req.reference,
          beneficiary: { bankAccountRef: req.beneficiaryAccountRef, name: req.beneficiaryName },
        },
      },
    }),
  });

  const data = await res.json() as { data: { createPayout: { payout: { id: string } } } };
  return data.data.createPayout.payout.id;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
