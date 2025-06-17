import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  WebSocketEvent, 
  ConnectionState, 
  UseGameSocketConfig,
  ClientMessage 
} from '@trivia/types';

interface UseGameSocketReturn {
  connectionState: ConnectionState;
  lastEvent: WebSocketEvent | null;
  sendMessage: (message: ClientMessage) => void;
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventType: string, handler: (event: WebSocketEvent) => void) => () => void;
}

export function useGameSocket(config: UseGameSocketConfig): UseGameSocketReturn {
  const {
    sessionCode,
    deviceId,
    isHost = false,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 1000
  } = config;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventHandlersRef = useRef<Map<string, ((event: WebSocketEvent) => void)[]>>(new Map());
  const isConnectingRef = useRef(false);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.DEV ? '3001' : window.location.port;
    return `${protocol}//${host}:${port}/ws`;
  }, []);

  const handleEvent = useCallback((event: WebSocketEvent) => {
    setLastEvent(event);
    
    const handlers = eventHandlersRef.current.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${event.type}:`, error);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionState('connecting');

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;

        // Join room automatically
        ws.send(JSON.stringify({
          type: 'join_room',
          sessionCode,
          deviceId,
          isHost
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          handleEvent(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnectionState('disconnected');
        isConnectingRef.current = false;
        wsRef.current = null;

        // Attempt reconnection if enabled and not a normal closure
        if (autoReconnect && event.code !== 1000) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        isConnectingRef.current = false;
        
        if (autoReconnect) {
          scheduleReconnect();
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
      isConnectingRef.current = false;
      
      if (autoReconnect) {
        scheduleReconnect();
      }
    }
  }, [sessionCode, deviceId, isHost, autoReconnect, getWebSocketUrl, handleEvent]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setConnectionState('error');
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Send leave room message before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'leave_room',
          sessionCode
        }));
      }
      
      wsRef.current.close(1000, 'Normal closure');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, [sessionCode]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  const subscribe = useCallback((eventType: string, handler: (event: WebSocketEvent) => void) => {
    const handlers = eventHandlersRef.current.get(eventType) || [];
    handlers.push(handler);
    eventHandlersRef.current.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = eventHandlersRef.current.get(eventType) || [];
      const filteredHandlers = currentHandlers.filter(h => h !== handler);
      
      if (filteredHandlers.length === 0) {
        eventHandlersRef.current.delete(eventType);
      } else {
        eventHandlersRef.current.set(eventType, filteredHandlers);
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      eventHandlersRef.current.clear();
    };
  }, []);

  return {
    connectionState,
    lastEvent,
    sendMessage,
    connect,
    disconnect,
    subscribe
  };
}