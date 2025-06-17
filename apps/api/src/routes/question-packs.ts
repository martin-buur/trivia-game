import { Hono } from 'hono';
import { db as defaultDb, questionPacks } from '@trivia/db';

export function createQuestionPacksRoute(db = defaultDb) {
  const questionPacksRoute = new Hono();

  // Get all question packs
  questionPacksRoute.get('/', async (c) => {
    try {
      const packs = await db.select().from(questionPacks);
      return c.json({ questionPacks: packs });
    } catch (error) {
      console.error('Error fetching question packs:', error);
      return c.json({ error: 'Failed to fetch question packs' }, 500);
    }
  });

  return questionPacksRoute;
}

export default createQuestionPacksRoute();
