import crypto from 'crypto';
import { logger } from './logger';

const SITE_CODE = process.env.OZOW_SITE_CODE ?? '';
const PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY ?? '';
const WEBHOOK_SECRET = process.env.OZOW_WEBHOOK_SECRET ?? '';
const IS_TEST = process.env.OZOW_IS_TEST === 'true';
const BASE_URL = IS_TEST ? 'https://stagingapi.ozow.com' : 'https://api.ozow.com';

export interface OzowPaymentRequest {
  orderId: string;
  amount: number;
  cancelUrl: string;
  errorUrl: string;
  successUrl: string;
  notifyUrl: string;
}

export interface OzowPaymentResponse {
  url: string;
  transactionId: string;
}

export async function createPaymentUrl(req: OzowPaymentRequest): Promise<OzowPaymentResponse> {
  if (!SITE_CODE || !PRIVATE_KEY) {
    const mockRef = `MOCK-${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const url = `${frontendUrl}/pay/mock-ozow?orderId=${encodeURIComponent(req.orderId)}&amount=${req.amount}&ref=${mockRef}`;
    logger.info({ orderId: req.orderId, url }, 'Ozow mock payment URL generated');
    return { url, transactionId: mockRef };
  }

  const payload = {
    SiteCode: SITE_CODE,
    CountryCode: 'ZA',
    CurrencyCode: 'ZAR',
    Amount: req.amount.toFixed(2),
    TransactionReference: req.orderId,
    BankReference: req.orderId,
    CancelUrl: req.cancelUrl,
    ErrorUrl: req.errorUrl,
    SuccessUrl: req.successUrl,
    NotifyUrl: req.notifyUrl,
    IsTest: IS_TEST,
  };

  const res = await fetch(`${BASE_URL}/getpaymentrequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ApiKey: PRIVATE_KEY },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as { url: string; transactionId: string };
  return data;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
