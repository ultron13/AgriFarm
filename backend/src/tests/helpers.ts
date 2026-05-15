import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = 'test-secret';

export function makeToken(sub: string, role: UserRole): string {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(sub: string, role: UserRole) {
  return { Authorization: `Bearer ${makeToken(sub, role)}` };
}
