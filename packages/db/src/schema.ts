import { pgTable, text, timestamp, integer, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const sessionStatusEnum = pgEnum('session_status', ['waiting', 'playing', 'finished']);
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const questionPacks = pgTable('question_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  category: text('category').notNull(),
  questionCount: integer('question_count').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  packId: uuid('pack_id').notNull().references(() => questionPacks.id),
  question: text('question').notNull(),
  options: text('options').array().notNull(),
  correctAnswerIndex: integer('correct_answer_index').notNull(),
  timeLimit: integer('time_limit').notNull().default(30),
  points: integer('points').notNull().default(100),
  order: integer('order').notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  hostDeviceId: text('host_device_id').notNull(),
  questionPackId: uuid('question_pack_id').notNull().references(() => questionPacks.id),
  status: sessionStatusEnum('status').notNull().default('waiting'),
  currentQuestionId: uuid('current_question_id').references(() => questions.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  deviceId: text('device_id').notNull(),
  nickname: text('nickname').notNull(),
  score: integer('score').notNull().default(0),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  questionId: uuid('question_id').notNull().references(() => questions.id),
  selectedOptionIndex: integer('selected_option_index').notNull(),
  isCorrect: integer('is_correct').notNull(),
  pointsEarned: integer('points_earned').notNull(),
  answeredAt: timestamp('answered_at').notNull().defaultNow(),
});