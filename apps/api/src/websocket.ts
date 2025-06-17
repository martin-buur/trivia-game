import { WebSocketServer, WebSocket } from 'ws';
import type { 
  WebSocketEvent, 
  ClientMessage, 
  JoinRoomMessage, 
  LeaveRoomMessage 
} from '@trivia/types';

interface GameClient {
  ws: WebSocket;
  sessionCode: string;
  deviceId: string;
  isHost: boolean;
  clientId: string;
  lastPing: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, GameClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private pingInterval: number | null = null;

  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (_info: any) => {
        // Basic validation - could add more security here
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocket, _request: any) => {
      const clientId = this.generateClientId();
      console.log(`WebSocket connection established: ${clientId}`);

      // Send connection acknowledgment
      this.sendToClient(ws, {
        type: 'connection_ack',
        sessionCode: '',
        timestamp: new Date().toISOString(),
        data: { clientId }
      });

      ws.on('message', (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, ws, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${clientId}`);
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error: any) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });
    });

    // Set up ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000) as unknown as number; // Ping every 30 seconds

    console.log('WebSocket server initialized');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, ws: WebSocket, message: ClientMessage) {
    switch (message.type) {
      case 'join_room':
        this.handleJoinRoom(clientId, ws, message);
        break;
      case 'leave_room':
        this.handleLeaveRoom(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${(message as any).type}`);
    }
  }

  private handleJoinRoom(clientId: string, ws: WebSocket, message: JoinRoomMessage) {
    const { sessionCode, deviceId, isHost = false } = message;

    // Remove client from any existing room
    this.handleClientDisconnect(clientId);

    // Create client record
    const client: GameClient = {
      ws,
      sessionCode,
      deviceId,
      isHost,
      clientId,
      lastPing: Date.now()
    };
    
    this.clients.set(clientId, client);

    // Add to room
    if (!this.rooms.has(sessionCode)) {
      this.rooms.set(sessionCode, new Set());
    }
    this.rooms.get(sessionCode)!.add(clientId);

    console.log(`Client ${clientId} joined room ${sessionCode} as ${isHost ? 'host' : 'player'}`);

    // Send acknowledgment with room info
    this.sendToClient(ws, {
      type: 'connection_ack',
      sessionCode,
      timestamp: new Date().toISOString(),
      data: {
        clientId,
        playerCount: this.rooms.get(sessionCode)?.size || 0
      }
    });
  }

  private handleLeaveRoom(clientId: string, message: LeaveRoomMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { sessionCode } = message;
    this.removeClientFromRoom(clientId, sessionCode);
  }

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.removeClientFromRoom(clientId, client.sessionCode);
    this.clients.delete(clientId);
  }

  private removeClientFromRoom(clientId: string, sessionCode: string) {
    const room = this.rooms.get(sessionCode);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(sessionCode);
        console.log(`Room ${sessionCode} is empty, cleaned up`);
      } else {
        console.log(`Client ${clientId} left room ${sessionCode}, ${room.size} clients remaining`);
      }
    }
  }

  private pingClients() {
    const now = Date.now();
    const staleClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (now - client.lastPing > 60000) { // 60 seconds timeout
        staleClients.push(clientId);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    });

    // Clean up stale clients
    staleClients.forEach(clientId => {
      console.log(`Removing stale client: ${clientId}`);
      this.handleClientDisconnect(clientId);
    });
  }

  private sendToClient(ws: WebSocket, event: WebSocketEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  private sendError(ws: WebSocket, message: string, code?: string) {
    this.sendToClient(ws, {
      type: 'error',
      sessionCode: '',
      timestamp: new Date().toISOString(),
      data: { message, code }
    });
  }

  // Public methods for broadcasting events
  broadcastToRoom(sessionCode: string, event: WebSocketEvent, excludeClientId?: string) {
    const room = this.rooms.get(sessionCode);
    if (!room) {
      console.warn(`Attempted to broadcast to non-existent room: ${sessionCode}`);
      return;
    }

    room.forEach(clientId => {
      if (excludeClientId && clientId === excludeClientId) return;
      
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(event));
      }
    });

    console.log(`Broadcasted ${event.type} to room ${sessionCode} (${room.size} clients)`);
  }

  broadcastToHost(sessionCode: string, event: WebSocketEvent) {
    const room = this.rooms.get(sessionCode);
    if (!room) return;

    room.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.isHost && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(event));
      }
    });
  }

  broadcastToPlayers(sessionCode: string, event: WebSocketEvent) {
    const room = this.rooms.get(sessionCode);
    if (!room) return;

    room.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && !client.isHost && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(event));
      }
    });
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
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    this.clients.clear();
    this.rooms.clear();
    console.log('WebSocket server shut down');
  }
}

export const wsManager = new WebSocketManager();