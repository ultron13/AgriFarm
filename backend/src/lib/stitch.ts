import crypto from 'crypto';
import { logger } from './logger';

const CLIENT_ID = process.env.STITCH_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.STITCH_CLIENT_SECRET ?? '';
const WEBHOOK_SECRET = process.env.STITCH_WEBHOOK_SECRET ?? '';
const BASE_URL = 'https://api.stitch.money';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

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
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
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
