import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isE2E = process.env.E2E_TEST === 'true';
const connectionString = process.env.DATABASE_URL!;

function createDb() {
  if (isProduction) {
    // Use Supabase PostgreSQL for production
    const sql = postgres(connectionString);
    return drizzle(sql, { schema });
  } else if (isTest) {
    // Use in-memory PGlite for testing (isolated, fast)
    const pglite = new PGlite('memory://');
    return drizzlePglite(pglite, { schema });
  } else if (isE2E) {
    console.log(
      'Using PGlite with filesystem persistence for E2E tests'
    );
    const pglite = new PGlite('../../.pglite/e2e-data');
    return drizzlePglite(pglite, { schema });
  } else {
    console.log(
      'Using PGlite with filesystem persistence for local development'
    );
    const pglite = new PGlite('../../.pglite/data');
    return drizzlePglite(pglite, { schema });
  }
}

export const db = createDb();
