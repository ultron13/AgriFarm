if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  throw new Error('JWT_SECRET env var is required — set it before starting the server');
}

export const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
