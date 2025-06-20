import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../apps/api/.env' });

const isProduction = process.env.NODE_ENV === 'production';
const isE2E = process.env.E2E_TEST === 'true';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(isProduction
    ? {
        dbCredentials: {
          url: process.env.DATABASE_URL!,
        },
      }
    : {
        driver: 'pglite',
        dbCredentials: {
          url: isE2E ? '../../.pglite/e2e-data' : '../../.pglite/data',
        },
      }),
} satisfies Config;
