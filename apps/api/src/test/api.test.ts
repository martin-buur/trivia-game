import { describe, it, expect, beforeEach } from 'vitest';
import { questionPacks } from '@trivia/db';
import { testDb as db } from './setup';

describe('API Database Integration', () => {
  beforeEach(async () => {
    // Clear data before each test
    await db.delete(questionPacks);
  });

  it('should connect to test database', async () => {
    // Test basic database connectivity
    const packs = await db.select().from(questionPacks);
    expect(packs).toEqual([]);
  });

  it('should create and retrieve question packs', async () => {
    // Test basic CRUD operations
    const [pack] = await db
      .insert(questionPacks)
      .values({
        name: 'Test Pack',
        description: 'A test question pack',
        difficulty: 'easy',
        category: 'general',
        questionCount: 5,
      })
      .returning();

    expect(pack.name).toBe('Test Pack');
    expect(pack.difficulty).toBe('easy');

    const packs = await db.select().from(questionPacks);
    expect(packs).toHaveLength(1);
    expect(packs[0].name).toBe('Test Pack');
  });
});
