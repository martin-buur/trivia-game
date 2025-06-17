import type { WebSocketEvent } from '@trivia/types';

export interface IWebSocketManager {
  initialize(server: unknown): void;
  broadcastToRoom(sessionCode: string, event: WebSocketEvent, excludeClientId?: string): void;
  broadcastToHost(sessionCode: string, event: WebSocketEvent): void;
  broadcastToPlayers(sessionCode: string, event: WebSocketEvent): void;
  getRoomInfo(sessionCode: string): { clientCount: number; hasHost: boolean };
  shutdown(): void;
}