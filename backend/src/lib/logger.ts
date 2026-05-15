import pino from 'pino';

// CF Workers don't support pino's worker_threads / process internals — fall back to console.
const isCF = process.env.CF_WORKER === 'true';

function serializeForCF(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const out: Record<string, unknown> = { ...obj };
  // Prisma/Error objects hide message, name, code behind non-enumerable properties.
  // Use duck-typing instead of instanceof so it works across module boundaries in CF bundles.
  const e = (obj as Record<string, unknown>).err;
  if (e != null && typeof e === 'object') {
    const err = e as Record<string, unknown>;
    out.err = {
      name: err.name ?? String((Object.getPrototypeOf(err) as { constructor?: { name?: string } })?.constructor?.name ?? ''),
      message: err.message ?? String(err),
      code: err.code,
      meta: err.meta,
      clientVersion: err.clientVersion,
    };
  }
  return out;
}

export const logger: pino.Logger = isCF
  ? ({
      info:  (obj: unknown, msg?: string) => console.log(msg ?? obj, serializeForCF(obj)),
      warn:  (obj: unknown, msg?: string) => console.warn(msg ?? obj, serializeForCF(obj)),
      error: (obj: unknown, msg?: string) => console.error(msg ?? obj, serializeForCF(obj)),
      debug: (obj: unknown, msg?: string) => console.debug(msg ?? obj, serializeForCF(obj)),
      fatal: (obj: unknown, msg?: string) => console.error(msg ?? obj, serializeForCF(obj)),
      child: () => logger,
    } as unknown as pino.Logger)
  : pino({
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      ...(process.env.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    });
