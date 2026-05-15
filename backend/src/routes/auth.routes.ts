import { Router, Request, Response, NextFunction, CookieOptions } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { validateBody } from '../middleware/validate';
import { ok, err } from '../types';

const rateLimitResponse = (code: string, message: string) =>
  (_req: Request, res: Response) => res.status(429).json(err(code, message));

const skipInTest = () => process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? '10'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitResponse('RATE_LIMITED', 'Too many login attempts, please try again in 15 minutes'),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.REGISTER_RATE_LIMIT_MAX ?? '5'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitResponse('RATE_LIMITED', 'Too many registration attempts, please try again later'),
});

import { JWT_SECRET } from '../lib/jwt-secret';
import { authenticate } from '../middleware/authenticate';
import { revokeUserTokens } from '../lib/token-revocation';
import { AuthenticatedRequest } from '../types';
import { deleteFile } from '../lib/r2';
import { audit } from '../lib/audit';

export const authRouter = Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matching default JWT expiry

function tokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['FARMER', 'BUYER', 'FIELD_AGENT', 'SALES_REP']),
  displayName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/register', registerLimiter, validateBody(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, role } = req.body as z.infer<typeof registerSchema>;

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
    if (existing) {
      res.status(409).json(err('CONFLICT', 'Email or phone already registered'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, phone, passwordHash, role } });

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    res.cookie('fc_token', token, tokenCookieOptions());
    res.status(201).json(ok({ userId: user.id, token, role: user.role }));
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', loginLimiter, validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json(err('INVALID_CREDENTIALS', 'Invalid email or password'));
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    res.cookie('fc_token', token, tokenCookieOptions());
    res.json(ok({ userId: user.id, token, role: user.role }));
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', authenticate, async (req: Request, res: Response) => {
  try { await revokeUserTokens((req as AuthenticatedRequest).user.sub); } catch { /* best-effort */ }
  res.clearCookie('fc_token', { path: '/' });
  res.json(ok({ loggedOut: true }));
});

// DELETE /auth/me — POPIA right-to-erasure (section 24)
// Anonymises all personal data in-place; financial records are retained for
// statutory tax purposes. Compliance docs are deleted from R2 and the DB.
authRouter.delete('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const { sub: userId, role } = (req as AuthenticatedRequest).user;
  try {
    // Collect R2 keys before the transaction so we can delete them after commit.
    let r2Keys: string[] = [];
    if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId } });
      if (farmer) {
        const docs = await prisma.complianceDoc.findMany({ where: { farmerId: farmer.id }, select: { fileKey: true } });
        r2Keys = docs.map(d => d.fileKey);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `erased-${userId}@deleted.farmconnect.co.za`,
          phone: null,
          passwordHash: '[ERASED]',
          isActive: false,
          deletedAt: new Date(),
        },
      });

      if (role === 'FARMER') {
        const farmer = await tx.farmer.findUnique({ where: { userId } });
        if (farmer) {
          await tx.complianceDoc.deleteMany({ where: { farmerId: farmer.id } });
          await tx.farmer.update({
            where: { id: farmer.id },
            data: { displayName: '[Deleted Farmer]', gpsLat: null, gpsLng: null, bankAccountRef: null, deletedAt: new Date() },
          });
        }
      } else if (role === 'BUYER' || role === 'GOV_BUYER') {
        await tx.buyer.updateMany({
          where: { userId },
          data: { displayName: '[Deleted Buyer]', whatsappNumber: null, deletedAt: new Date() },
        });
      }
    });

    // Best-effort R2 deletion after the DB transaction commits.
    await Promise.allSettled(r2Keys.map(key => deleteFile(key)));

    try { await revokeUserTokens(userId); } catch { /* best-effort */ }
    res.clearCookie('fc_token', { path: '/' });

    await audit({ userId, action: 'ACCOUNT_ERASED', resourceType: 'User', resourceId: userId, ip: req.ip });

    res.json(ok({ erased: true }));
  } catch (e) {
    next(e);
  }
});
