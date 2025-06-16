import "dotenv/config";
import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "@trivia/db";
import path from "path";

// Set NODE_ENV to test to ensure we use in-memory PGlite
process.env.NODE_ENV = "test";

// Apply schema using migrations
async function setupTestDatabase() {
  try {
    // Apply migrations to set up the schema
    const migrationsFolder = path.resolve(
      process.cwd(),
      "../../packages/db/drizzle",
    );
    await migrate(db, { migrationsFolder });
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  }
}

// Setup schema once before all tests
beforeAll(async () => {
  await setupTestDatabase();
});
