import { describe, it, expect, beforeEach, vi } from 'vitest';
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
import { mockWsManager } from './mocks/websocket-mock';

// Helper to create test app
const createTestApp = () => {
  const app = new Hono();
  const sessionsRoute = createSessionsRoute(db, mockWsManager);
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

    // Clear WebSocket mock events
    mockWsManager.clearEvents();

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
      const [testSession] = await db.insert(sessions).values({
        code: 'TEST01',
        hostDeviceId: 'host-123',
        questionPackId: testPack.id,
        status: 'playing',
        currentQuestionId: testQuestions[2].id, // Last question
      }).returning();

      // Add players to the session so there's a winner
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
          score: 200,
        },
      ]);

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

  describe('GET /sessions/:code/answer-status', () => {
    it('should get answer status for current question', async () => {
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

      const [player1, player2] = await db
        .insert(players)
        .values([
          {
            sessionId: testSession.id,
            nickname: 'Alice',
            deviceId: 'device-1',
          },
          {
            sessionId: testSession.id,
            nickname: 'Bob',
            deviceId: 'device-2',
          },
          {
            sessionId: testSession.id,
            nickname: 'Charlie',
            deviceId: 'device-3',
          },
        ])
        .returning();

      // Player 1 and 2 answer, Player 3 hasn't answered yet
      await db.insert(answers).values([
        {
          playerId: player1.id,
          questionId: testQuestions[0].id,
          selectedOptionIndex: 0,
          isCorrect: 1,
          pointsEarned: 100,
        },
        {
          playerId: player2.id,
          questionId: testQuestions[0].id,
          selectedOptionIndex: 1,
          isCorrect: 0,
          pointsEarned: 0,
        },
      ]);

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/answer-status');

      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data.currentQuestion.id).toBe(testQuestions[0].id);
      expect(data.currentQuestion.order).toBe(1);
      expect(data.totalPlayers).toBe(3);
      expect(data.answeredCount).toBe(2);
      expect(data.answeredPlayers).toHaveLength(2);
      expect(data.unansweredPlayers).toHaveLength(1);
      
      // Check answered players
      expect(data.answeredPlayers.map((p: { nickname: string }) => p.nickname)).toContain('Alice');
      expect(data.answeredPlayers.map((p: { nickname: string }) => p.nickname)).toContain('Bob');
      
      // Check unanswered players
      expect(data.unansweredPlayers[0].nickname).toBe('Charlie');
    });

    it('should return error for session without current question', async () => {
      await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'waiting',
          currentQuestionId: null,
        })
        .returning();

      const app = createTestApp();

      const res = await app.request('/sessions/TEST01/answer-status');

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('No current question');
    });

    it('should return error for non-existent session', async () => {
      const app = createTestApp();

      const res = await app.request('/sessions/INVALID/answer-status');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Session not found');
    });
  });

  describe('Question Timeout Functionality', () => {
    beforeEach(() => {
      // Reset all spies before each test
      vi.clearAllMocks();
      // Create spy for broadcastToRoom
      vi.spyOn(mockWsManager, 'broadcastToRoom');
    });

    it('should create timeout answers for players who dont respond in time', async () => {
      // Create session
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'TEST01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      // Add two players
      const [player1, player2] = await db
        .insert(players)
        .values([
          {
            sessionId: sessionData.id,
            deviceId: 'player-1',
            nickname: 'Alice',
            score: 0,
          },
          {
            sessionId: sessionData.id,
            deviceId: 'player-2',
            nickname: 'Bob',
            score: 0,
          },
        ])
        .returning();

      // Player 1 answers
      await db.insert(answers).values({
        playerId: player1.id,
        questionId: testQuestions[0].id,
        selectedOptionIndex: 0,
        isCorrect: 1,
        pointsEarned: 100,
      });

      // Mock the timeout handler directly (since we can't wait for real timeout in tests)
      const { handleQuestionTimeout } = await import('../routes/sessions');
      
      // Call timeout handler manually
      await handleQuestionTimeout('TEST01', testQuestions[0].id, db, mockWsManager);

      // Check that timeout answer was created for player 2
      const timeoutAnswers = await db.query.answers.findMany({
        where: (answers, { eq, and }) => and(
          eq(answers.questionId, testQuestions[0].id),
          eq(answers.playerId, player2.id)
        ),
      });

      expect(timeoutAnswers).toHaveLength(1);
      expect(timeoutAnswers[0].selectedOptionIndex).toBe(-1); // Timeout indicator
      expect(timeoutAnswers[0].isCorrect).toBe(0);
      expect(timeoutAnswers[0].pointsEarned).toBe(0);

      // Check that both answer_revealed and question_completed were broadcast
      const broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      
      const answerRevealedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'answer_revealed'
      );
      expect(answerRevealedCall).toBeTruthy();
      
      const questionCompletedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'question_completed'
      );
      expect(questionCompletedCall).toBeTruthy();
      expect(questionCompletedCall?.[1].data.timeoutPlayers).toContain('player-2');
    });

    it('should not create timeout answers if all players already answered', async () => {
      // Create session
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'TEST02',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      // Add player
      const [player1] = await db
        .insert(players)
        .values([
          {
            sessionId: sessionData.id,
            deviceId: 'player-1',
            nickname: 'Alice',
            score: 0,
          },
        ])
        .returning();

      // Player answers
      await db.insert(answers).values({
        playerId: player1.id,
        questionId: testQuestions[0].id,
        selectedOptionIndex: 0,
        isCorrect: 1,
        pointsEarned: 100,
      });

      // Mock the timeout handler directly
      const { handleQuestionTimeout } = await import('../routes/sessions');
      
      // Call timeout handler - should do nothing since player already answered
      await handleQuestionTimeout('TEST02', testQuestions[0].id, db, mockWsManager);

      // Check that no additional answers were created
      const allAnswers = await db.query.answers.findMany({
        where: (answers, { eq }) => eq(answers.questionId, testQuestions[0].id),
      });

      expect(allAnswers).toHaveLength(1); // Only the original answer
      expect(allAnswers[0].selectedOptionIndex).toBe(0); // Not a timeout
    });

    it('should clear timeout when all players answer early', async () => {
      // This test verifies the early timeout clearing logic in answer submission
      // Create session
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'TEST03',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      // Add player
      await db.insert(players).values({
        sessionId: sessionData.id,
        deviceId: 'player-1',
        nickname: 'Alice',
        score: 0,
      });

      const app = createTestApp();

      // Submit answer - this should trigger early timeout clearance
      const res = await app.request('/sessions/TEST03/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'player-1',
          answerIndex: 0,
        }),
      });

      expect(res.status).toBe(200);

      // Check that websocket was called with allAnswered: true
      expect(mockWsManager.broadcastToRoom).toHaveBeenCalledWith(
        'TEST03',
        expect.objectContaining({
          type: 'answer_submitted',
          data: expect.objectContaining({
            allAnswered: true
          })
        })
      );
    });
  });

  describe('Auto-progression feature', () => {
    it('should auto-progress to next question after timeout', async () => {
      // Create session with 2 questions
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'AUTOPROG',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      // Add player
      await db.insert(players).values({
        sessionId: sessionData.id,
        deviceId: 'player-1',
        nickname: 'Alice',
        score: 0,
      });

      // Mock the timeout handler
      const { handleQuestionTimeout } = await import('../routes/sessions');
      
      // Clear any previous broadcasts
      mockWsManager.clearEvents();
      
      // Call timeout handler
      await handleQuestionTimeout('AUTOPROG', testQuestions[0].id, db, mockWsManager);
      
      // Wait for auto-progression delay (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Check that question_revealed was broadcast for next question
      const broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      const questionRevealedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'question_revealed' && call[0] === 'AUTOPROG'
      );
      
      expect(questionRevealedCall).toBeTruthy();
      expect(questionRevealedCall?.[1].data.questionNumber).toBe(2);
      expect(questionRevealedCall?.[1].data.question.id).toBe(testQuestions[1].id);
    });

    it('should end game after last question timeout', async () => {
      // Create session on last question
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'AUTOEND',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[2].id, // Last question
        })
        .returning();

      // Add players
      await db.insert(players).values([
        {
          sessionId: sessionData.id,
          deviceId: 'player-1',
          nickname: 'Alice',
          score: 300,
        },
        {
          sessionId: sessionData.id,
          deviceId: 'player-2',
          nickname: 'Bob',
          score: 100,
        },
      ]);

      // Mock the timeout handler
      const { handleQuestionTimeout } = await import('../routes/sessions');
      
      // Clear any previous broadcasts
      mockWsManager.clearEvents();
      
      // Call timeout handler
      await handleQuestionTimeout('AUTOEND', testQuestions[2].id, db, mockWsManager);
      
      // Wait for auto-progression delay
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Check that game_finished was broadcast
      const broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      const gameFinishedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'game_finished' && call[0] === 'AUTOEND'
      );
      
      expect(gameFinishedCall).toBeTruthy();
      expect(gameFinishedCall?.[1].data.finalScores).toHaveLength(2);
      expect(gameFinishedCall?.[1].data.winner.nickname).toBe('Alice');
      expect(gameFinishedCall?.[1].data.winner.totalScore).toBe(300);
      
      // Check session status is finished
      const updatedSession = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.code, 'AUTOEND'),
      });
      expect(updatedSession?.status).toBe('finished');
    });
  });
  
  describe('Auto-reveal feature', () => {
    beforeEach(() => {
      // Clear all mock events before each test
      mockWsManager.clearEvents();
    });

    it('should auto-reveal answer when timeout occurs', async () => {
      // Create session
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'AUTO01',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'playing',
          currentQuestionId: testQuestions[0].id,
        })
        .returning();

      // Add players
      const [player1] = await db
        .insert(players)
        .values([
          {
            sessionId: sessionData.id,
            deviceId: 'player-1',
            nickname: 'Alice',
            score: 0,
          },
          {
            sessionId: sessionData.id,
            deviceId: 'player-2',
            nickname: 'Bob',
            score: 0,
          },
        ])
        .returning();

      // Only player 1 answers
      await db.insert(answers).values({
        playerId: player1.id,
        questionId: testQuestions[0].id,
        selectedOptionIndex: 0,
        isCorrect: 1,
        pointsEarned: 100,
      });

      // Mock the timeout handler
      const { handleQuestionTimeout } = await import('../routes/sessions');
      
      // Call timeout handler
      await handleQuestionTimeout('AUTO01', testQuestions[0].id, db, mockWsManager);

      // Check that answer_revealed event was broadcast
      const broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      const answerRevealedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'answer_revealed' && call[0] === 'AUTO01'
      );
      
      expect(answerRevealedCall).toBeTruthy();
      expect(answerRevealedCall?.[0]).toBe('AUTO01');
      expect(answerRevealedCall?.[1].data.questionId).toBe(testQuestions[0].id);
      expect(answerRevealedCall?.[1].data.correctAnswerIndex).toBe(0);
      
      // Check that both players are in the results
      const playerResults = answerRevealedCall?.[1].data.playerResults;
      expect(playerResults).toHaveLength(2);

      // Check that question_completed was also broadcast
      const questionCompletedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'question_completed' && call[0] === 'AUTO01'
      );
      
      expect(questionCompletedCall).toBeTruthy();
      // Only player-2 should be in timeout players since player-1 answered
      const timeoutPlayers = questionCompletedCall?.[1].data.timeoutPlayers;
      expect(timeoutPlayers).toContain('player-2');
      expect(timeoutPlayers).not.toContain('player-1');
    });

    // Skip this test - has timing issues with fake timers and HTTP requests
    it.skip('should auto-reveal answer when all players answer and 5 seconds have passed', async () => {
      // This functionality is tested in E2E tests where real timers work better
    });

    it('should schedule auto-reveal after 5 seconds when all players answer quickly', async () => {
      vi.useFakeTimers();
      
      // Create session
      const [sessionData] = await db
        .insert(sessions)
        .values({
          code: 'AUTO03',
          hostDeviceId: 'host-123',
          questionPackId: testPack.id,
          status: 'waiting', // Start as waiting
        })
        .returning();

      // Add one player
      await db.insert(players).values({
        sessionId: sessionData.id,
        deviceId: 'player-1',
        nickname: 'Alice',
        score: 0,
      });

      const app = createTestApp();

      // Start the game
      await app.request('/sessions/AUTO03/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDeviceId: 'host-123' }),
      });

      // Answer immediately (within 1 second)
      vi.advanceTimersByTime(1000);

      // Clear previous mock calls
      mockWsManager.clearEvents();

      await app.request('/sessions/AUTO03/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'player-1',
          answerIndex: 0,
        }),
      });

      // Should not reveal immediately
      let broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      let answerRevealedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'answer_revealed' && call[0] === 'AUTO03'
      );
      
      expect(answerRevealedCall).toBeFalsy();

      // Fast forward to 5 seconds total
      vi.advanceTimersByTime(4000);
      
      // Run any async timers
      await vi.runAllTimersAsync();

      // Now it should have auto-revealed
      broadcastCalls = (mockWsManager.broadcastToRoom as any).mock.calls;
      answerRevealedCall = broadcastCalls.find(
        (call: any) => call[1].type === 'answer_revealed' && call[0] === 'AUTO03'
      );
      
      expect(answerRevealedCall).toBeTruthy();
      expect(answerRevealedCall?.[0]).toBe('AUTO03');

      vi.useRealTimers();
    });
  });
});
