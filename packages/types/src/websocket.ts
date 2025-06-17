import type { Player } from './index';

export type WebSocketEventType =
  | 'player_joined'
  | 'player_left'
  | 'game_started'
  | 'question_revealed'
  | 'answer_submitted'
  | 'question_completed'
  | 'scores_updated'
  | 'game_finished'
  | 'connection_ack'
  | 'error';

export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  sessionCode: string;
  timestamp: string;
}

export interface PlayerJoinedEvent extends BaseWebSocketEvent {
  type: 'player_joined';
  data: {
    player: Player;
    totalPlayers: number;
  };
}

export interface PlayerLeftEvent extends BaseWebSocketEvent {
  type: 'player_left';
  data: {
    playerId: string;
    nickname: string;
    totalPlayers: number;
  };
}

export interface GameStartedEvent extends BaseWebSocketEvent {
  type: 'game_started';
  data: {
    questionCount: number;
    firstQuestion: {
      id: string;
      text: string;
      options: string[];
      timeLimit: number;
    };
  };
}

export interface QuestionRevealedEvent extends BaseWebSocketEvent {
  type: 'question_revealed';
  data: {
    questionNumber: number;
    totalQuestions: number;
    question: {
      id: string;
      text: string;
      options: string[];
      timeLimit: number;
    };
    // Only included for host
    correctAnswer?: string;
  };
}

export interface AnswerSubmittedEvent extends BaseWebSocketEvent {
  type: 'answer_submitted';
  data: {
    playerId: string;
    nickname: string;
    answeredCount: number;
    totalPlayers: number;
    allAnswered: boolean;
  };
}

export interface QuestionCompletedEvent extends BaseWebSocketEvent {
  type: 'question_completed';
  data: {
    questionId: string;
    correctAnswer: string;
    scores: Array<{
      playerId: string;
      nickname: string;
      score: number;
      isCorrect: boolean;
      timeToAnswer?: number;
    }>;
    timeoutPlayers?: string[]; // Player IDs who timed out
  };
}

export interface ScoresUpdatedEvent extends BaseWebSocketEvent {
  type: 'scores_updated';
  data: {
    scores: Array<{
      playerId: string;
      nickname: string;
      totalScore: number;
      rank: number;
    }>;
  };
}

export interface GameFinishedEvent extends BaseWebSocketEvent {
  type: 'game_finished';
  data: {
    finalScores: Array<{
      playerId: string;
      nickname: string;
      totalScore: number;
      rank: number;
    }>;
    winner: {
      playerId: string;
      nickname: string;
      totalScore: number;
    } | null;
  };
}

export interface ConnectionAckEvent extends BaseWebSocketEvent {
  type: 'connection_ack';
  data: {
    clientId: string;
    sessionState?: 'waiting' | 'playing' | 'finished';
    playerCount?: number;
  };
}

export interface ErrorEvent extends BaseWebSocketEvent {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

export type WebSocketEvent =
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | QuestionRevealedEvent
  | AnswerSubmittedEvent
  | QuestionCompletedEvent
  | ScoresUpdatedEvent
  | GameFinishedEvent
  | ConnectionAckEvent
  | ErrorEvent;

// Client-to-server messages
export interface JoinRoomMessage {
  type: 'join_room';
  sessionCode: string;
  deviceId: string;
  isHost?: boolean;
}

export interface LeaveRoomMessage {
  type: 'leave_room';
  sessionCode: string;
}

export type ClientMessage = JoinRoomMessage | LeaveRoomMessage;

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket hook configuration
export interface UseGameSocketConfig {
  sessionCode: string;
  deviceId: string;
  isHost?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}