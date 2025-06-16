import { Hono } from 'hono';
import { db } from '../db';
import { questionPacks } from '@trivia/db/schema';

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

export default questionPacksRoute;