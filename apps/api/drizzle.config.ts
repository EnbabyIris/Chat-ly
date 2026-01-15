//@ts-nocheck
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chat_turbo_dev',
  },
  verbose: true,
  strict: true,
});