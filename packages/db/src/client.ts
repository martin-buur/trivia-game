import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL!;

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePglite>;

if (isProduction) {
  // Use Supabase PostgreSQL for production
  const sql = postgres(connectionString);
  db = drizzle(sql, { schema });
} else {
  // Use PGlite for local development
  const pglite = new PGlite('../../.pglite/data');
  db = drizzlePglite(pglite, { schema });
}

export { db };