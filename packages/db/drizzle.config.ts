import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../apps/api/.env' });

const isProduction = process.env.NODE_ENV === 'production';

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
          url: '../../.pglite/data',
        },
      }
  ),
} satisfies Config;