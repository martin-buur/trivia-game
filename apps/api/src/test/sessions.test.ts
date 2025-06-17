import { describe, it, expect, beforeEach } from 'vitest';
import {
  sessions,
  players,
  questionPacks,
  questions,
  answers,
} from '@trivia/db';
import { Hono } from 'hono';
import { createSessionsRoute } from '../routes/sessions';
import { testDb as db } from './setup';

// Helper to create test app
const createTestApp = () => {
  const app = new Hono();
  const sessionsRoute = createSessionsRoute(db);
  app.route('/sessions', sessionsRoute);
  return app;
};

describe('Sessions API', () => {
  let testPack: { id: string };
  let testQuestions: Array<{ id: string; order: number }>;

  beforeEach(async () => {
    // Clear data before each test (in correct order for foreign keys)
    await db.delete(answers);
    await db.delete(players);
    await db.delete(sessions);
    await db.delete(questions);
    await db.delete(questionPacks);

    // Create test question pack
    [testPack] = await db
      .insert(questionPacks)
      .values({
        name: 'Test Pack',
        description: 'Test Description',
        difficulty: 'easy',
        category: 'general',
        questionCount: 3,
      })
      .returning();

    // Create test questions
    testQuestions = await db
      .insert(questions)
      .values([
        {
          packId: testPack.id,
          question: 'Question 1?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 0,
          points: 100,
          order: 1,
        },
        {
          packId: testPack.id,
          question: 'Question 2?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 1,
          points: 200,
          order: 2,
        },
        {
          packId: testPack.id,
          question: 'Question 3?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 2,
          points: 300,
          order: 3,
        },
      ])
      .returning();
  });

  describe('POST /sessions', () => {
    it('should create a new session', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session).toBeDefined();
      expect(data.session.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(data.session.hostDeviceId).toBe('host-123');
      expect(data.session.questionPackId).toBe(testPack.id);
      expect(data.session.status).toBe('waiting');
      expect(data.session.questionPack).toBeDefined();
    });

    it('should return 404 for non-existent question pack', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
          questionPackId: '00000000-0000-0000-0000-000000000000',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Question pack not found');
    });

    it('should validate required fields', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: '',
          questionPackId: testPack.id,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('GET /sessions/:code', () => {
    it('should get session by code', async () => {
      // Create test session
      const [testSession] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'waiting',
        })
        .returning();

      // Add test players
      await db.insert(players).values([
        {
          sessionId: testSession.id,
          nickname: 'Player1',
          deviceId: 'device-1',
        },
        {
          sessionId: testSession.id,
          nickname: 'Player2',
          deviceId: 'device-2',
        },
      ]);

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session).toBeDefined();
      expect(data.session.code).toBe('TEST01');
      expect(data.session.players).toHaveLength(2);
      expect(data.session.questionPack).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions/NOEXIST');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Session not found');
    });

    it('should be case-insensitive for session codes', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'waiting',
      });

      const app = createTestApp();

      const res = await app.request('/sessions/test01');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session.code).toBe('TEST01');
    });
  });

  describe('PATCH /sessions/:code/status', () => {
    it('should update session status as host', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'waiting',
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'playing',
          hostDeviceId: 'host-123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session.status).toBe('playing');
    });

    it('should reject non-host updates', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'waiting',
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'playing',
          hostDeviceId: 'wrong-host',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /sessions/:code/start', () => {
    it('should start game and set first question', async () => {
      await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'waiting',
        })
        .returning();

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session.status).toBe('playing');
      expect(data.session.currentQuestionId).toBe(testQuestions[0].id);
      expect(data.question).toBeDefined();
      expect(data.question.question).toBe('Question 1?');
      expect(data.question.correctAnswerIndex).toBeUndefined();
    });

    it('should prevent starting already started game', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Game already started or finished');
    });
  });

  describe('GET /sessions/:code/current-question', () => {
    it('should get current question without answer', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
        currentQuestionId: testQuestions[0].id,
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/current-question');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.question).toBeDefined();
      expect(data.question.question).toBe('Question 1?');
      expect(data.question.correctAnswerIndex).toBeUndefined();
    });

    it('should include answer when requested', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
        currentQuestionId: testQuestions[0].id,
      });

      const app = createTestApp();

      const res = await app.request(
        '/sessions/TEST01/current-question?includeAnswer=true'
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.question.correctAnswerIndex).toBe(0);
    });
  });

  describe('POST /sessions/:code/answers', () => {
    it('should submit answer and award points for correct answer', async () => {
      const [testSession] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      await db
        .insert(players)
        .values({
          sessionId: testSession.id,
          nickname: 'Player1',
          deviceId: 'device-1',
          score: 0,
        })
        .returning();

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'device-1',
          answerIndex: 0, // Correct answer
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.correct).toBe(true);
      expect(data.pointsEarned).toBe(100);
      expect(data.totalScore).toBe(100);
    });

    it('should not award points for incorrect answer', async () => {
      const [testSession] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      await db.insert(players).values({
        sessionId: testSession.id,
        nickname: 'Player1',
        deviceId: 'device-1',
        score: 0,
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'device-1',
          answerIndex: 1, // Wrong answer
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.correct).toBe(false);
      expect(data.pointsEarned).toBe(0);
      expect(data.totalScore).toBe(0);
    });

    it('should prevent duplicate answers', async () => {
      const [testSession] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      const [player] = await db
        .insert(players)
        .values({
          sessionId: testSession.id,
          nickname: 'Player1',
          deviceId: 'device-1',
        })
        .returning();

      // Submit first answer
      await db.insert(answers).values({
        playerId: player.id,
        questionId: testQuestions[0].id,
        selectedOptionIndex: 0,
        isCorrect: 1,
        pointsEarned: 100,
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'device-1',
          answerIndex: 0,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Already answered this question');
    });
  });

  describe('POST /sessions/:code/next-question', () => {
    it('should move to next question', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
        currentQuestionId: testQuestions[0].id,
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasNext).toBe(true);
      expect(data.question.question).toBe('Question 2?');
      expect(data.session.currentQuestionId).toBe(testQuestions[1].id);
    });

    it('should finish game when no more questions', async () => {
      await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
        currentQuestionId: testQuestions[2].id, // Last question
      });

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostDeviceId: 'host-123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasNext).toBe(false);
      expect(data.session.status).toBe('finished');
    });
  });

  describe('GET /sessions/:code/scores', () => {
    it('should get player scores sorted by score', async () => {
      const [testSession] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
        })
        .returning();

      await db.insert(players).values([
        {
          sessionId: testSession.id,
          nickname: 'Player1',
          deviceId: 'device-1',
          score: 300,
        },
        {
          sessionId: testSession.id,
          nickname: 'Player2',
          deviceId: 'device-2',
          score: 500,
        },
        {
          sessionId: testSession.id,
          nickname: 'Player3',
          deviceId: 'device-3',
          score: 200,
        },
      ]);

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/scores');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.players).toHaveLength(3);
      expect(data.players[0].score).toBe(500);
      expect(data.players[1].score).toBe(300);
      expect(data.players[2].score).toBe(200);
      expect(data.gameStatus).toBe('playing');
    });
  });
});
