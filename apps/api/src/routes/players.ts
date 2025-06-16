import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db as defaultDb, sessions, players } from '@trivia/db';

export function createPlayersRoute(db = defaultDb) {
  const playersRoute = new Hono();

  // Join session schema
  const joinSessionSchema = z.object({
    nickname: z.string().min(1).max(20),
    deviceId: z.string().min(1),
  });

  // Update player schema
  const updatePlayerSchema = z.object({
    nickname: z.string().min(1).max(20).optional(),
  });

  // Join a session
  playersRoute.post('/sessions/:code/players', async (c) => {
    try {
      const code = c.req.param('code');
      const body = await c.req.json();
      const validated = joinSessionSchema.parse(body);

      // Check if session exists and is joinable
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.code, code.toUpperCase()),
        with: {
          players: true,
        },
      });

      if (!session) {
        return c.json({ error: 'Session not found' }, 404);
      }

      if (session.status !== 'waiting') {
        return c.json({ error: 'Session is not accepting new players' }, 400);
      }

      // Check if device is already in session
      const existingPlayer = session.players.find(
        (p) => p.deviceId === validated.deviceId
      );

      if (existingPlayer) {
        return c.json({ player: existingPlayer });
      }

      // Create new player
      const [player] = await db
        .insert(players)
        .values({
          sessionId: session.id,
          nickname: validated.nickname,
          deviceId: validated.deviceId,
        })
        .returning();

      return c.json({ player }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request data', details: error.errors },
          400
        );
      }
      console.error('Error joining session:', error);
      return c.json({ error: 'Failed to join session' }, 500);
    }
  });

  // Update player details
  playersRoute.patch('/players/:id', async (c) => {
    try {
      const playerId = c.req.param('id');
      const body = await c.req.json();
      const validated = updatePlayerSchema.parse(body);

      // Check if player exists
      const player = await db.query.players.findFirst({
        where: eq(players.id, playerId),
      });

      if (!player) {
        return c.json({ error: 'Player not found' }, 404);
      }

      // Update player
      const [updated] = await db
        .update(players)
        .set({
          ...validated,
        })
        .where(eq(players.id, playerId))
        .returning();

      return c.json({ player: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request data', details: error.errors },
          400
        );
      }
      console.error('Error updating player:', error);
      return c.json({ error: 'Failed to update player' }, 500);
    }
  });

  // Leave session
  playersRoute.delete('/players/:id', async (c) => {
    try {
      const playerId = c.req.param('id');

      // Check if player exists
      const player = await db.query.players.findFirst({
        where: eq(players.id, playerId),
      });

      if (!player) {
        return c.json({ error: 'Player not found' }, 404);
      }

      // Delete player
      await db.delete(players).where(eq(players.id, playerId));

      return c.json({ success: true }, 200);
    } catch (error) {
      console.error('Error removing player:', error);
      return c.json({ error: 'Failed to remove player' }, 500);
    }
  });

  return playersRoute;
}

export default createPlayersRoute();