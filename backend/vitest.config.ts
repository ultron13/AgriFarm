import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    env: { BCRYPT_ROUNDS: '4' },
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/tests/**', 'src/**/*.d.ts', 'src/worker.ts', 'src/server.ts',
        'src/jobs/**',               // BullMQ workers — integration level
        'src/lib/logger.ts',         // config-only
        'src/lib/prisma.ts',         // config-only
        'src/lib/clickatell.ts',     // external API wrapper
        'src/lib/r2.ts',             // external API wrapper
        'src/lib/ozow.ts',           // external PSP wrapper
        'src/lib/stitch.ts',         // external PSP wrapper
        'src/services/whatsapp.service.ts', // complex state machine tested via route mocks
      ],
      thresholds: { lines: 85, functions: 85, branches: 70, statements: 85 },
    },
  },
});
