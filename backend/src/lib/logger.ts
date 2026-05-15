import pino from 'pino';

// CF Workers don't support pino's worker_threads / process internals — fall back to console.
const isCF = process.env.CF_WORKER === 'true';

export const logger: pino.Logger = isCF
  ? ({
      info:  (obj: unknown, msg?: string) => console.log(msg ?? obj, typeof obj === 'object' ? obj : ''),
      warn:  (obj: unknown, msg?: string) => console.warn(msg ?? obj, typeof obj === 'object' ? obj : ''),
      error: (obj: unknown, msg?: string) => console.error(msg ?? obj, typeof obj === 'object' ? obj : ''),
      debug: (obj: unknown, msg?: string) => console.debug(msg ?? obj, typeof obj === 'object' ? obj : ''),
      fatal: (obj: unknown, msg?: string) => console.error(msg ?? obj, typeof obj === 'object' ? obj : ''),
      child: () => logger,
    } as unknown as pino.Logger)
  : pino({
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      ...(process.env.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    });
