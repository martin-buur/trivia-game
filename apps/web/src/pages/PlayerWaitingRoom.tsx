import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { api, useApi } from '@/lib/api';
import { useGameSocket } from '@/hooks/useGameSocket';
import { getDeviceId } from '@trivia/utils';
import type { Session, Player, PlayerJoinedEvent, PlayerLeftEvent, GameStartedEvent } from '@trivia/types';

export function PlayerWaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<
    (Session & { players: Player[] }) | null
  >(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId] = useState(() => localStorage.getItem('playerId'));
  const [playerNickname] = useState(() =>
    localStorage.getItem('playerNickname')
  );

  const { execute: fetchSession } = useApi<Session & { players: Player[] }>();
  const sessionCode = code?.toUpperCase() || '';

  // WebSocket connection for real-time updates
  const { connectionState, subscribe } = useGameSocket({
    sessionCode,
    deviceId: getDeviceId(),
    isHost: false,
    autoReconnect: true
  });

  // Handle player joined event
  useEffect(() => {
    const unsubscribe = subscribe('player_joined', (event) => {
      const playerJoinedEvent = event as PlayerJoinedEvent;
      setPlayers(prev => {
        const existingPlayer = prev.find(p => p.id === playerJoinedEvent.data.player.id);
        if (existingPlayer) return prev;
        return [...prev, playerJoinedEvent.data.player];
      });
    });
    return unsubscribe;
  }, [subscribe]);

  // Handle player left event
  useEffect(() => {
    const unsubscribe = subscribe('player_left', (event) => {
      const playerLeftEvent = event as PlayerLeftEvent;
      setPlayers(prev => prev.filter(p => p.id !== playerLeftEvent.data.playerId));
    });
    return unsubscribe;
  }, [subscribe]);

  // Handle game started event
  useEffect(() => {
    const unsubscribe = subscribe('game_started', (event) => {
      const gameStartedEvent = event as GameStartedEvent;
      console.log('Game started, navigating to game view...', gameStartedEvent);
      navigate(`/play/${sessionCode}/game`);
    });
    return unsubscribe;
  }, [subscribe, navigate, sessionCode]);

  useEffect(() => {
    if (!sessionCode || !playerId) {
      navigate('/');
      return;
    }

    // Load initial session data
    const loadSession = async () => {
      try {
        const sessionData = await fetchSession(api.sessions.get(sessionCode));
        setSession(sessionData);
        setPlayers(sessionData.players || []);

        // If game has already started when we load, redirect immediately
        if (sessionData.status === 'playing') {
          navigate(`/play/${sessionCode}/game`);
        } else if (sessionData.status === 'finished') {
          navigate(`/play/${sessionCode}/results`);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        navigate('/');
      }
    };

    loadSession();
  }, [sessionCode, playerId, fetchSession, navigate]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // const otherPlayers = session.players.filter(p => p.id !== playerId);
  // const currentPlayer = session.players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md sm:max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary mb-2">
            Waiting Room
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-lg sm:text-xl text-gray-700">
              Game Code: <span className="font-bold">{sessionCode}</span>
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' : 
                connectionState === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <p className="text-xs text-gray-500 capitalize">{connectionState}</p>
            </div>
          </div>
        </div>

        {/* Player Card */}
        <Card variant="floating" animate className="mb-6 p-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent-green to-accent-blue shadow-xl mb-4 flex items-center justify-center animate-bounce-slow">
              <span className="text-3xl">🎮</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {playerNickname || 'Player'}
            </h2>
            <p className="text-gray-600">That&apos;s you!</p>
          </div>
        </Card>

        {/* Other Players */}
        <Card variant="default" className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Players in Lobby ({players.length})
          </h3>

          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  player.id === playerId
                    ? 'bg-accent-blue/20 border-2 border-accent-blue'
                    : 'bg-gray-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    player.id === playerId
                      ? 'bg-gradient-to-br from-accent-green to-accent-blue text-white'
                      : 'bg-gray-300'
                  }`}
                >
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {player.nickname}
                    {player.id === playerId && ' (You)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Waiting Message */}
        <div className="text-center mt-6 animate-pulse-slow">
          <p className="text-gray-600">
            Waiting for the host to start the game...
          </p>
        </div>
      </div>
    </div>
  );
}
