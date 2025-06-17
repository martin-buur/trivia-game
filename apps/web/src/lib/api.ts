import type { Session, Player, Question, QuestionPack } from '@trivia/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

export const api = {
  // Session endpoints
  sessions: {
    create: async (data: {
      hostDeviceId: string;
      questionPackId: string;
    }): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await handleResponse<{ session: Session }>(response);
      return result.session;
    },

    get: async (code: string): Promise<Session & { players: Player[] }> => {
      const response = await fetch(`${API_BASE_URL}/sessions/${code}`);
      const result = await handleResponse<{
        session: Session & { players: Player[] };
      }>(response);
      return result.session;
    },

    updateStatus: async (
      code: string,
      status: 'waiting' | 'playing' | 'finished',
      hostDeviceId: string
    ): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/sessions/${code}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, hostDeviceId }),
      });
      const result = await handleResponse<{ session: Session }>(response);
      return result.session;
    },

    start: async (
      code: string,
      hostDeviceId: string
    ): Promise<{ session: Session; question: Question }> => {
      const response = await fetch(`${API_BASE_URL}/sessions/${code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDeviceId }),
      });
      return handleResponse<{ session: Session; question: Question }>(response);
    },
  },

  // Player endpoints
  players: {
    join: async (
      sessionCode: string,
      deviceId: string,
      nickname: string
    ): Promise<Player> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/players`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, nickname }),
        }
      );
      const result = await handleResponse<{ player: Player }>(response);
      return result.player;
    },

    leave: async (sessionCode: string, deviceId: string): Promise<void> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/players/${deviceId}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        throw new ApiError('Failed to leave session', response.status);
      }
    },
  },

  // Question pack endpoints
  questionPacks: {
    list: async (): Promise<QuestionPack[]> => {
      const response = await fetch(`${API_BASE_URL}/question-packs`);
      const data = await handleResponse<{ questionPacks: QuestionPack[] }>(
        response
      );
      return data.questionPacks;
    },

    get: async (
      id: string
    ): Promise<QuestionPack & { questions: Question[] }> => {
      const response = await fetch(`${API_BASE_URL}/question-packs/${id}`);
      return handleResponse<QuestionPack & { questions: Question[] }>(response);
    },
  },

  // Game flow endpoints
  game: {
    getCurrentQuestion: async (
      sessionCode: string,
      includeAnswer = false
    ): Promise<Question> => {
      const url = new window.URL(
        `${API_BASE_URL}/sessions/${sessionCode}/current-question`
      );
      if (includeAnswer) url.searchParams.set('includeAnswer', 'true');
      const response = await fetch(url);
      const result = await handleResponse<{ question: Question }>(response);
      return result.question;
    },

    submitAnswer: async (
      sessionCode: string,
      deviceId: string,
      answerIndex: number
    ): Promise<{
      correct: boolean;
      pointsEarned: number;
      totalScore: number;
    }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/answers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, answerIndex }),
        }
      );
      return handleResponse<{
        correct: boolean;
        pointsEarned: number;
        totalScore: number;
      }>(response);
    },

    revealAnswer: async (
      sessionCode: string,
      hostDeviceId: string
    ): Promise<{
      success: boolean;
      correctAnswerIndex: number;
    }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/reveal-answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostDeviceId }),
        }
      );
      return handleResponse<{
        success: boolean;
        correctAnswerIndex: number;
      }>(response);
    },

    nextQuestion: async (
      sessionCode: string,
      hostDeviceId: string
    ): Promise<{
      hasNext: boolean;
      question?: Question;
      session?: Session;
    }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/next-question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostDeviceId }),
        }
      );
      return handleResponse<{
        hasNext: boolean;
        question?: Question;
        session?: Session;
      }>(response);
    },

    getScores: async (
      sessionCode: string
    ): Promise<{ players: Player[]; gameStatus: string }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/scores`
      );
      return handleResponse<{ players: Player[]; gameStatus: string }>(
        response
      );
    },

    getAnswerStatus: async (
      sessionCode: string
    ): Promise<{
      currentQuestion: { id: string; order: number };
      totalPlayers: number;
      answeredCount: number;
      answeredPlayers: { id: string; nickname: string; answeredAt: string }[];
      unansweredPlayers: { id: string; nickname: string }[];
    }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/answer-status`
      );
      return handleResponse<{
        currentQuestion: { id: string; order: number };
        totalPlayers: number;
        answeredCount: number;
        answeredPlayers: { id: string; nickname: string; answeredAt: string }[];
        unansweredPlayers: { id: string; nickname: string }[];
      }>(response);
    },
  },
};

// Helper hook for API calls with loading and error states
import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: Promise<T>) => {
    setState({ data: null, loading: true, error: null });

    try {
      const data = await apiCall;
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError('An unexpected error occurred', 500);
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  return { ...state, execute };
}
