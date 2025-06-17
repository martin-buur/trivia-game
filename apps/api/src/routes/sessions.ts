import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db as defaultDb, sessions, questionPacks, players, answers } from '@trivia/db';
import { generateSessionCode } from '@trivia/utils';

export function createSessionsRoute(db = defaultDb) {
  const sessionsRoute = new Hono();

// Create session schema
const createSessionSchema = z.object({
  hostDeviceId: z.string().min(1),
  questionPackId: z.string().uuid(),
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
      return c.json(
        { error: 'Invalid request data', details: error.errors },
        400
      );
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

// Start game
sessionsRoute.post('/:code/start', async (c) => {
  try {
    const code = c.req.param('code');
    const { hostDeviceId } = await c.req.json();

    // Verify host and session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        questionPack: {
          with: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.hostDeviceId !== hostDeviceId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (session.status !== 'waiting') {
      return c.json({ error: 'Game already started or finished' }, 400);
    }

    // Get first question
    const firstQuestion = session.questionPack.questions.sort(
      (a, b) => a.order - b.order
    )[0];

    if (!firstQuestion) {
      return c.json({ error: 'No questions found in pack' }, 400);
    }

    // Update session to playing state with first question
    const [updated] = await db
      .update(sessions)
      .set({
        status: 'playing',
        currentQuestionId: firstQuestion.id,
        updatedAt: new Date(),
      })
      .where(eq(sessions.code, code.toUpperCase()))
      .returning();

    return c.json({
      session: updated,
      question: {
        ...firstQuestion,
        correctAnswerIndex: undefined, // Don't send correct answer to clients
      },
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return c.json({ error: 'Failed to start game' }, 500);
  }
});

// Get current question
sessionsRoute.get('/:code/current-question', async (c) => {
  try {
    const code = c.req.param('code');
    const includeAnswer = c.req.query('includeAnswer') === 'true';

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        currentQuestion: true,
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (!session.currentQuestion) {
      return c.json({ error: 'No current question' }, 404);
    }

    const question = {
      ...session.currentQuestion,
      correctAnswerIndex: includeAnswer
        ? session.currentQuestion.correctAnswerIndex
        : undefined,
    };

    return c.json({ question });
  } catch (error) {
    console.error('Error getting current question:', error);
    return c.json({ error: 'Failed to get current question' }, 500);
  }
});

// Submit answer
sessionsRoute.post('/:code/answers', async (c) => {
  try {
    const code = c.req.param('code');
    const { deviceId, answerIndex } = await c.req.json();

    // Get session and current question
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        currentQuestion: true,
        players: {
          where: eq(players.deviceId, deviceId),
        },
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.status !== 'playing') {
      return c.json({ error: 'Game not in progress' }, 400);
    }

    if (!session.currentQuestion) {
      return c.json({ error: 'No current question' }, 400);
    }

    const player = session.players[0];
    if (!player) {
      return c.json({ error: 'Player not found' }, 404);
    }

    // Check if player already answered this question
    const existingAnswer = await db.query.answers.findFirst({
      where: and(
        eq(answers.playerId, player.id),
        eq(answers.questionId, session.currentQuestion.id)
      ),
    });

    if (existingAnswer) {
      return c.json({ error: 'Already answered this question' }, 400);
    }

    // Calculate points
    const isCorrect =
      answerIndex === session.currentQuestion.correctAnswerIndex;
    const pointsEarned = isCorrect ? session.currentQuestion.points : 0;

    // Save answer
    await db.insert(answers).values({
      playerId: player.id,
      questionId: session.currentQuestion.id,
      selectedOptionIndex: answerIndex,
      isCorrect: isCorrect ? 1 : 0,
      pointsEarned,
    });

    // Update player score
    const [updatedPlayer] = await db
      .update(players)
      .set({ score: player.score + pointsEarned })
      .where(eq(players.id, player.id))
      .returning();

    return c.json({
      correct: isCorrect,
      pointsEarned,
      totalScore: updatedPlayer.score,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return c.json({ error: 'Failed to submit answer' }, 500);
  }
});

// Move to next question
sessionsRoute.post('/:code/next-question', async (c) => {
  try {
    const code = c.req.param('code');
    const { hostDeviceId } = await c.req.json();

    // Verify host and get session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        questionPack: {
          with: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.hostDeviceId !== hostDeviceId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (session.status !== 'playing') {
      return c.json({ error: 'Game not in progress' }, 400);
    }

    // Get all questions sorted by order
    const sortedQuestions = session.questionPack.questions.sort(
      (a, b) => a.order - b.order
    );

    // Find current question index
    const currentIndex = sortedQuestions.findIndex(
      (q) => q.id === session.currentQuestionId
    );

    // Check if there's a next question
    const nextQuestion = sortedQuestions[currentIndex + 1];

    if (!nextQuestion) {
      // No more questions, end the game
      const [updated] = await db
        .update(sessions)
        .set({
          status: 'finished',
          updatedAt: new Date(),
        })
        .where(eq(sessions.code, code.toUpperCase()))
        .returning();

      return c.json({
        hasNext: false,
        session: updated,
      });
    }

    // Update to next question
    const [updated] = await db
      .update(sessions)
      .set({
        currentQuestionId: nextQuestion.id,
        updatedAt: new Date(),
      })
      .where(eq(sessions.code, code.toUpperCase()))
      .returning();

    return c.json({
      hasNext: true,
      question: {
        ...nextQuestion,
        correctAnswerIndex: undefined, // Don't send correct answer
      },
      session: updated,
    });
  } catch (error) {
    console.error('Error moving to next question:', error);
    return c.json({ error: 'Failed to move to next question' }, 500);
  }
});

// Get scores
sessionsRoute.get('/:code/scores', async (c) => {
  try {
    const code = c.req.param('code');

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code.toUpperCase()),
      with: {
        players: {
          orderBy: [desc(players.score)],
        },
      },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({
      players: session.players,
      gameStatus: session.status,
    });
  } catch (error) {
    console.error('Error getting scores:', error);
    return c.json({ error: 'Failed to get scores' }, 500);
  }
});

  return sessionsRoute;
}

export default createSessionsRoute();
