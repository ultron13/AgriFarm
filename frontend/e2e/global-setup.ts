import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-seed the database before every Playwright run so tests always start from
// a known state. The demo seed uses upsert with stable IDs, so it restores
// any demo accounts or listings that were mutated during a previous run.
// Any rows created by tests with random IDs are left in place; they are
// generally harmless for the read-heavy E2E flows.
export default async function globalSetup() {
  const backendDir = path.resolve(__dirname, '../../backend');
  execSync('npx tsx prisma/demo-seed.ts', { cwd: backendDir, stdio: 'inherit' });
}
