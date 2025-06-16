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
    create: async (
      hostDeviceId: string,
      questionPackId: string
    ): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDeviceId, questionPackId }),
      });
      return handleResponse<Session>(response);
    },

    get: async (code: string): Promise<Session & { players: Player[] }> => {
      const response = await fetch(`${API_BASE_URL}/sessions/${code}`);
      return handleResponse<Session & { players: Player[] }>(response);
    },

    updateStatus: async (
      code: string,
      status: 'waiting' | 'active' | 'completed',
      hostDeviceId: string
    ): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/sessions/${code}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, hostDeviceId }),
      });
      return handleResponse<Session>(response);
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
      return handleResponse<Player>(response);
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
      return handleResponse<QuestionPack[]>(response);
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
    getCurrentQuestion: async (sessionCode: string): Promise<Question> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/current-question`
      );
      return handleResponse<Question>(response);
    },

    submitAnswer: async (
      sessionCode: string,
      deviceId: string,
      answerIndex: number
    ): Promise<{ correct: boolean; score: number }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/answers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, answerIndex }),
        }
      );
      return handleResponse<{ correct: boolean; score: number }>(response);
    },

    nextQuestion: async (
      sessionCode: string,
      hostDeviceId: string
    ): Promise<{ hasNext: boolean; question?: Question }> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/next-question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostDeviceId }),
        }
      );
      return handleResponse<{ hasNext: boolean; question?: Question }>(
        response
      );
    },

    getScores: async (sessionCode: string): Promise<Player[]> => {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionCode}/scores`
      );
      return handleResponse<Player[]>(response);
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
