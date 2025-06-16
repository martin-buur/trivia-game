import 'dotenv/config';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import * as path from 'path';
import {
  questionPacks,
  questions,
  sessions,
  players,
  answers,
  questionPacksRelations,
  questionsRelations,
  sessionsRelations,
  playersRelations,
  answersRelations,
  sessionStatusEnum,
  difficultyEnum,
} from '@trivia/db';

// Set NODE_ENV to test to ensure we use in-memory PGlite
process.env.NODE_ENV = 'test';

// Create schema object for drizzle
const schema = {
  questionPacks,
  questions,
  sessions,
  players,
  answers,
  questionPacksRelations,
  questionsRelations,
  sessionsRelations,
  playersRelations,
  answersRelations,
  sessionStatusEnum,
  difficultyEnum,
};

// Create test-specific database instance
const testPglite = new PGlite('memory://');
const testDb = drizzle(testPglite, { schema });

// Apply schema using drizzle migrations
async function setupTestDatabase() {
  try {
    await migrate(testDb, {
      migrationsFolder: path.join(__dirname, '../../../../packages/db/drizzle'),
    });
    console.log('Test database migration complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

// Setup schema once before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Export test database for use in tests
export { testDb };
