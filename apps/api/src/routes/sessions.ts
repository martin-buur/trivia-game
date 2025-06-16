import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, questionPacks } from '@trivia/db';
import { generateSessionCode } from '@trivia/utils';

const sessionsRoute = new Hono();

// Create session schema
const createSessionSchema = z.object({
  hostDeviceId: z.string().min(1),
  questionPackId: z.string().uuid(),
});

// Join session schema
const joinSessionSchema = z.object({
  code: z.string().length(6),
});

// Create a new session
sessionsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createSessionSchema.parse(body);

    // Verify question pack exists
    const questionPack = await db.query.questionPacks.findFirst({
      where: eq(questionPacks.id, validated.questionPackId),
    });

    if (!questionPack) {
      return c.json({ error: 'Question pack not found' }, 404);
    }

    // Generate unique session code
    let code: string;
    let attempts = 0;
    do {
      code = generateSessionCode();
      const existing = await db.query.sessions.findFirst({
        where: eq(sessions.code, code),
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return c.json({ error: 'Failed to generate unique code' }, 500);
    }

    // Create session
    const [session] = await db
      .insert(sessions)
      .values({
        code,
        hostDeviceId: validated.hostDeviceId,
        questionPackId: validated.questionPackId,
      })
      .returning();

    return c.json({
      session: {
        ...session,
        questionPack,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request data', details: error.errors }, 400);
    }
    console.error('Error creating session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// Get session by code
sessionsRoute.get('/:code', async (c) => {
  try {
    const code = c.req.param('code');

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        questionPack: true,
        players: true,
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    return c.json({ error: 'Failed to get session' }, 500);
  }
});

// Update session status
sessionsRoute.patch('/:code/status', async (c) => {
  try {
    const code = c.req.param('code');
    const { status, hostDeviceId } = await c.req.json();

    // Verify host
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.hostDeviceId !== hostDeviceId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Update status
    const [updated] = await db
      .update(sessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(sessions.code, code.toUpperCase()))
      .returning();

    return c.json({ session: updated });
  } catch (error) {
    console.error('Error updating session:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

export default sessionsRoute;