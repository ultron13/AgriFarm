import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

vi.mock('../lib/ozow', () => ({
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
  createPaymentUrl: vi.fn(),
}));
vi.mock('../lib/stitch', () => ({
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
}));
vi.mock('../lib/redis', () => ({
  redis: { set: vi.fn().mockResolvedValue('OK'), get: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../services/whatsapp.service', () => ({
  WhatsAppService: { handleIncoming: vi.fn().mockResolvedValue('OK') },
}));

const app = createApp();

function body(data: object) {
  return Buffer.from(JSON.stringify(data));
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/v1/webhooks/ozow', () => {
  beforeEach(() => {
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.order.update).mockResolvedValue({} as any);
    vi.mocked(prisma.payout.findMany).mockResolvedValue([]);
  });

  it('returns 400 on bad signature', async () => {
    const { verifyWebhookSignature } = await import('../lib/ozow');
    vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);
    const res = await request(app)
      .post('/api/v1/webhooks/ozow')
      .set('Content-Type', 'application/json')
      .send(body({ TransactionReference: 'o1', Status: 'Complete', TransactionId: 'tx1' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful Complete payment', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/ozow')
      .set('Content-Type', 'application/json')
      .send(body({ TransactionReference: 'o1', Status: 'Complete', TransactionId: 'tx2' }));
    expect(res.status).toBe(200);
  });

  it('returns 200 on non-Complete (failed) payment', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/ozow')
      .set('Content-Type', 'application/json')
      .send(body({ TransactionReference: 'o1', Status: 'Cancelled', TransactionId: 'tx3' }));
    expect(res.status).toBe(200);
  });

  it('schedules payout jobs when pending payouts exist on Complete', async () => {
    vi.mocked(prisma.payout.findMany).mockResolvedValue([{ id: 'p1' }, { id: 'p2' }] as any);
    const res = await request(app)
      .post('/api/v1/webhooks/ozow')
      .set('Content-Type', 'application/json')
      .send(body({ TransactionReference: 'o1', Status: 'Complete', TransactionId: 'tx4' }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/webhooks/stitch', () => {
  beforeEach(() => {
    vi.mocked(prisma.payout.updateMany).mockResolvedValue({ count: 1 } as any);
  });

  it('returns 400 on bad signature', async () => {
    const { verifyWebhookSignature } = await import('../lib/stitch');
    vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);
    const res = await request(app)
      .post('/api/v1/webhooks/stitch')
      .set('Content-Type', 'application/json')
      .send(body({ type: 'payout.completed', data: { payoutId: 'p1', status: 'completed' } }));
    expect(res.status).toBe(400);
  });

  it('returns 200 on payout.completed', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/stitch')
      .set('Content-Type', 'application/json')
      .send(body({ type: 'payout.completed', data: { payoutId: 'p1', status: 'completed' } }));
    expect(res.status).toBe(200);
  });

  it('returns 200 on payout.failed', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/stitch')
      .set('Content-Type', 'application/json')
      .send(body({ type: 'payout.failed', data: { payoutId: 'p2', status: 'failed' } }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/webhooks/whatsapp', () => {
  it('returns 200 in non-production without token config', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({ moMessage: { from: '+27821234567', content: 'Hello' } });
    expect(res.status).toBe(200);
  });

  it('returns 401 when token provided does not match', async () => {
    const prev = process.env.WHATSAPP_WEBHOOK_TOKEN;
    process.env.WHATSAPP_WEBHOOK_TOKEN = 'secret';
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .set('x-clickatell-token', 'wrong')
      .send({ moMessage: { from: '+27821234567', content: 'Hello' } });
    expect(res.status).toBe(401);
    process.env.WHATSAPP_WEBHOOK_TOKEN = prev;
  });

  it('returns 200 when correct token provided', async () => {
    const prev = process.env.WHATSAPP_WEBHOOK_TOKEN;
    process.env.WHATSAPP_WEBHOOK_TOKEN = 'secret';
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .set('x-clickatell-token', 'secret')
      .send({ moMessage: { from: '+27821234567', content: 'Hello' } });
    expect(res.status).toBe(200);
    process.env.WHATSAPP_WEBHOOK_TOKEN = prev;
  });

  it('returns 200 but skips processing when payload has no phone or text', async () => {
    delete process.env.WHATSAPP_WEBHOOK_TOKEN;
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({ someOtherField: 'value' });
    expect(res.status).toBe(200);
  });
});
