import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';

async function globalSetup(config: FullConfig) {
  console.log('\n🎭 Playwright Global Setup');
  
  // Remove existing E2E database to start fresh
  const e2eDbPath = join(process.cwd(), '..', '..', '.pglite', 'e2e-data');
  console.log('🗑️  Cleaning E2E test database...');
  try {
    rmSync(e2eDbPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }

  // Set E2E_TEST environment variable for database client
  process.env.E2E_TEST = 'true';

  // Push schema to E2E database
  console.log('📋 Pushing schema to E2E database...');
  execSync('pnpm db:push:test', {
    cwd: join(process.cwd(), '..', '..', 'packages', 'db'),
    stdio: 'inherit'
  });

  // Seed E2E database with test data
  console.log('🌱 Seeding E2E database with test data...');
  execSync('pnpm db:seed:test', {
    cwd: join(process.cwd(), '..', '..', 'packages', 'db'),
    stdio: 'inherit'
  });

  console.log('✅ E2E test setup complete!\n');
}

export default globalSetup;