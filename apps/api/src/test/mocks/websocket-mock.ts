import type { WebSocketEvent } from '@trivia/types';
import type { IWebSocketManager } from '../../types/websocket-manager';

interface GameClient {
  ws: unknown;
  sessionCode: string;
  deviceId: string;
  isHost: boolean;
  clientId: string;
  lastPing: number;
}

class MockWebSocketManager implements IWebSocketManager {
  private clients: Map<string, GameClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private events: WebSocketEvent[] = [];

  initialize(_server: unknown) {
    console.log('Mock WebSocket server initialized');
  }

  broadcastToRoom(sessionCode: string, event: WebSocketEvent, _excludeClientId?: string) {
    console.log(`Mock broadcast to room ${sessionCode}:`, event.type);
    this.events.push(event);
    
    const room = this.rooms.get(sessionCode);
    if (!room) {
      console.warn(`Attempted to broadcast to non-existent room: ${sessionCode}`);
      return;
    }

    // Mock broadcast logic - just log for tests
    console.log(`Broadcasted ${event.type} to room ${sessionCode} (${room.size} clients)`);
  }

  broadcastToHost(sessionCode: string, event: WebSocketEvent) {
    console.log(`Mock broadcast to host in ${sessionCode}:`, event.type);
    this.events.push(event);
  }

  broadcastToPlayers(sessionCode: string, event: WebSocketEvent) {
    console.log(`Mock broadcast to players in ${sessionCode}:`, event.type);
    this.events.push(event);
  }

  getRoomInfo(sessionCode: string) {
    const room = this.rooms.get(sessionCode);
    if (!room) return { clientCount: 0, hasHost: false };

    let hasHost = false;
    room.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.isHost) {
        hasHost = true;
      }
    });

    return {
      clientCount: room.size,
      hasHost
    };
  }

  shutdown() {
    this.clients.clear();
    this.rooms.clear();
    this.events = [];
    console.log('Mock WebSocket server shut down');
  }

  // Test utilities
  getLastEvent(): WebSocketEvent | null {
    return this.events[this.events.length - 1] || null;
  }

  getEventsByType(type: string): WebSocketEvent[] {
    return this.events.filter(event => event.type === type);
  }

  clearEvents() {
    this.events = [];
  }

  // Mock room management for tests
  addMockRoom(sessionCode: string, clientCount: number = 1, hasHost: boolean = true) {
    const room = new Set<string>();
    
    for (let i = 0; i < clientCount; i++) {
      const clientId = `mock-client-${i}`;
      const client: GameClient = {
        ws: {},
        sessionCode,
        deviceId: `device-${i}`,
        isHost: i === 0 && hasHost,
        clientId,
        lastPing: Date.now()
      };
      
      this.clients.set(clientId, client);
      room.add(clientId);
    }
    
    this.rooms.set(sessionCode, room);
  }
}

export const mockWsManager = new MockWebSocketManager();