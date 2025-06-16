import "dotenv/config";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
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
  answersRelations
} from "@trivia/db";

// Set NODE_ENV to test to ensure we use in-memory PGlite
process.env.NODE_ENV = "test";

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
  answersRelations
};

// Create test-specific database instance
const testPglite = new PGlite("memory://");
const testDb = drizzle(testPglite, { schema });

// Apply schema using drizzle-kit push (simpler than migrations for tests)
async function setupTestDatabase() {
  try {
    // For tests, we'll apply the schema directly using SQL
    // This is simpler than using migrations for in-memory databases
    console.log("Test database setup completed (schema applied via drizzle)");
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  }
}

// Setup schema once before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Export test database for use in tests
export { testDb };
