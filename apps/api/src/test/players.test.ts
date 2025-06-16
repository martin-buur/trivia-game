import { describe, it, expect, beforeEach } from 'vitest';
import { sessions, players, questionPacks } from '@trivia/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createPlayersRoute } from '../routes/players';
import { testDb as db } from './setup';

// Helper to create test app
const createTestApp = () => {
  const app = new Hono();
  const playersRoute = createPlayersRoute(db);
  app.route('/', playersRoute);
  return app;
};

describe('Player Management API', () => {
  let testPack: { id: string };
  let testSession: { id: string };

  beforeEach(async () => {
    // Clear data before each test
    await db.delete(players);
    await db.delete(sessions);
    await db.delete(questionPacks);

    // Create test question pack
    [testPack] = await db
      .insert(questionPacks)
      .values({
        name: 'Test Pack',
        description: 'Test Description',
        difficulty: 'easy',
        category: 'general',
        questionCount: 5,
      })
      .returning();

    // Create test session
    [testSession] = await db
      .insert(sessions)
      .values({
        code: 'TEST01',
        hostDeviceId: 'host-device-123',
        questionPackId: testPack.id,
        status: 'waiting',
      })
      .returning();
  });

  describe('POST /sessions/:code/players', () => {
    it('should allow a player to join a session', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'TestPlayer',
          deviceId: 'device-123',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.player).toBeDefined();
      expect(data.player.nickname).toBe('TestPlayer');
      expect(data.player.deviceId).toBe('device-123');
      expect(data.player.sessionId).toBe(testSession.id);
    });

    it('should return existing player if device already joined', async () => {
      const app = createTestApp();

      // First join
      await app.request('/sessions/TEST01/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'TestPlayer',
          deviceId: 'device-123',
        }),
      });

      // Try to join again with same device
      const res = await app.request('/sessions/TEST01/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'DifferentName',
          deviceId: 'device-123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.player.nickname).toBe('TestPlayer'); // Should return original player
    });

    it('should not allow joining a non-existent session', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions/NOEXIST/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'TestPlayer',
          deviceId: 'device-123',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Session not found');
    });

    it('should not allow joining a session that is not in waiting status', async () => {
      // Update session to playing status
      await db
        .update(sessions)
        .set({ status: 'playing' })
        .where(eq(sessions.code, 'TEST01'));

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'TestPlayer',
          deviceId: 'device-123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Session is not accepting new players');
    });

    it('should validate required fields', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: '', // Empty nickname
          deviceId: 'device-123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('PATCH /players/:id', () => {
    it('should update player nickname', async () => {
      // Create a test player
      const [player] = await db
        .insert(players)
        .values({
          sessionId: testSession.id,
          nickname: 'OldName',
          deviceId: 'device-123',
        })
        .returning();

      const app = createTestApp();

      const res = await app.request(`/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'NewName',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.player.nickname).toBe('NewName');
    });

    it('should return 404 for non-existent player', async () => {
      const app = createTestApp();

      const res = await app.request(
        '/players/00000000-0000-0000-0000-000000000000',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: 'NewName',
          }),
        }
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Player not found');
    });
  });

  describe('DELETE /players/:id', () => {
    it('should remove player from session', async () => {
      // Create a test player
      const [player] = await db
        .insert(players)
        .values({
          sessionId: testSession.id,
          nickname: 'TestPlayer',
          deviceId: 'device-123',
        })
        .returning();

      const app = createTestApp();

      const res = await app.request(`/players/${player.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify player was deleted
      const remainingPlayers = await db.select().from(players);
      expect(remainingPlayers).toHaveLength(0);
    });

    it('should return 404 for non-existent player', async () => {
      const app = createTestApp();

      const res = await app.request(
        '/players/00000000-0000-0000-0000-000000000000',
        {
          method: 'DELETE',
        }
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Player not found');
    });
  });
});
