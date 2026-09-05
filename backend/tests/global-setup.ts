import { execSync } from 'child_process';

/**
 * Jest global setup — runs ONCE before any test file loads.
 *
 * Points Prisma at a dedicated test database so the test suite's
 * cleanupTestDB() can never wipe development data. process.env.DATABASE_URL
 * takes precedence over the .env file Prisma reads.
 */
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  (process.env.DATABASE_URL ?? 'postgresql://adarshsharma@localhost:5432/urban_furniture').replace(
    /\/[^/]+$/,
    '/urban_furniture_test',
  );

process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = 'test';

// Apply the latest schema to the test database (idempotent).
execSync('npx prisma db push --skip-generate --accept-data-loss', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: TEST_DB_URL },
});

export default function globalSetup(): void {
  // DATABASE_URL is set above before any PrismaClient is constructed.
}
