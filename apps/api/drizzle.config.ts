import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

/**
 * Load env from either:
 * - apps/api/.env (when running inside apps/api)
 * - repo root .env (common monorepo setup)
 */
const envPaths = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '..', '.env')];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  /**
   * drizzle-kit v0.20.x expects `driver`, not `dialect`.
   * Using `dialect` makes the config effectively ignored and causes CLI validation errors.
   */
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});