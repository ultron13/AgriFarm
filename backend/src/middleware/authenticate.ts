import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthenticatedRequest, err } from '../types';
import { getJwtSecret } from '../lib/jwt-secret';
import { isTokenRevoked } from '../lib/token-revocation';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Cookie takes precedence (browser clients); Authorization header is the fallback (API/mobile clients).
  const cookieToken: string | undefined = (req as Request & { cookies: Record<string, string> }).cookies?.fc_token;
  const header = req.headers.authorization;

  let token: string | undefined;
  if (cookieToken) {
    token = cookieToken;
  } else if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) {
    res.status(401).json(err('UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;

    if (await isTokenRevoked(payload.sub, payload.iat ?? 0)) {
      res.status(401).json(err('TOKEN_REVOKED', 'Token has been revoked'));
      return;
    }

    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json(err('TOKEN_INVALID', 'Token is invalid or expired'));
  }
}
