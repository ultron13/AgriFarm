import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { authHeader } from './helpers';

vi.mock('../services/whatsapp.service', () => ({
  WhatsAppService: {
    handleIncoming: vi.fn().mockResolvedValue('Reply message'),
    getActiveSessions: vi.fn().mockResolvedValue([]),
    getSessionHistory: vi.fn().mockResolvedValue(null),
  },
}));

const app = createApp();
const adminToken = authHeader('admin-user', 'ADMIN');
const salesToken = authHeader('sales-user', 'SALES_REP');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('POST /api/v1/whatsapp/simulate', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/whatsapp/simulate').send({ phone: '+27821234567', message: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('requires ADMIN or SALES_REP role', async () => {
    const res = await request(app).post('/api/v1/whatsapp/simulate').set(buyerToken).send({ phone: '+27821234567', message: 'Hi' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when phone missing', async () => {
    const res = await request(app).post('/api/v1/whatsapp/simulate').set(adminToken).send({ message: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when message missing', async () => {
    const res = await request(app).post('/api/v1/whatsapp/simulate').set(adminToken).send({ phone: '+27821234567' });
    expect(res.status).toBe(400);
  });

  it('returns reply for ADMIN', async () => {
    const { WhatsAppService } = await import('../services/whatsapp.service');
    vi.mocked(WhatsAppService.handleIncoming).mockResolvedValueOnce('Welcome to FarmConnect!');
    const res = await request(app)
      .post('/api/v1/whatsapp/simulate')
      .set(adminToken)
      .send({ phone: '+27821234567', message: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.data.reply).toBe('Welcome to FarmConnect!');
  });

  it('returns reply for SALES_REP', async () => {
    const { WhatsAppService } = await import('../services/whatsapp.service');
    vi.mocked(WhatsAppService.handleIncoming).mockResolvedValueOnce('Here are your options');
    const res = await request(app)
      .post('/api/v1/whatsapp/simulate')
      .set(salesToken)
      .send({ phone: '+27821234567', message: 'Menu' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/whatsapp/sessions', () => {
  it('requires ADMIN role', async () => {
    const res = await request(app).get('/api/v1/whatsapp/sessions').set(salesToken);
    expect(res.status).toBe(403);
  });

  it('returns active sessions for ADMIN', async () => {
    const { WhatsAppService } = await import('../services/whatsapp.service');
    vi.mocked(WhatsAppService.getActiveSessions).mockResolvedValueOnce([{ phone: '+27821234567' }] as any);
    const res = await request(app).get('/api/v1/whatsapp/sessions').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/whatsapp/sessions/:phone', () => {
  it('returns 404 when no active session', async () => {
    const { WhatsAppService } = await import('../services/whatsapp.service');
    vi.mocked(WhatsAppService.getSessionHistory).mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/whatsapp/sessions/%2B27821234567').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns session history', async () => {
    const { WhatsAppService } = await import('../services/whatsapp.service');
    vi.mocked(WhatsAppService.getSessionHistory).mockResolvedValueOnce({ messages: [] } as any);
    const res = await request(app).get('/api/v1/whatsapp/sessions/%2B27821234567').set(adminToken);
    expect(res.status).toBe(200);
  });
});
