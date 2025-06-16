import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { getDeviceId } from '@trivia/utils';
import type { Session, Player } from '@trivia/types';

export function HostLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string>('');

  const loadSession = useCallback(async () => {
    if (!code) return;
    try {
      const sessionData = await api.sessions.get(code);
      setSession(sessionData);
      setPlayers(sessionData.players || []);
      setError('');
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    loadSession();
    // Poll for player updates
    const interval = window.setInterval(loadSession, 2000);
    return () => window.clearInterval(interval);
  }, [code, navigate, loadSession]);

  const handleStartGame = async () => {
    if (!session) return;

    setIsStarting(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      await api.sessions.updateStatus(session.code, 'active', deviceId);
      // Navigate to game view
      navigate(`/host/${session.code}/game`);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Make sure you are the host.');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Session Not Found</h2>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="heading mb-4">Game Lobby</h1>
          <div className="inline-block">
            <Card variant="floating" className="px-8 py-6">
              <p className="text-sm text-gray-600 mb-2">Game Code</p>
              <p className="text-5xl font-bold tracking-wider text-blue-600">
                {session.code}
              </p>
            </Card>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Players ({players.length})
              </h2>
              {players.length === 0 ? (
                <p className="text-gray-500">Waiting for players to join...</p>
              ) : (
                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{player.nickname}</span>
                      <span className="text-sm text-gray-500">
                        {player.score} points
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Game Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Question Pack</p>
                  <p className="font-medium">
                    {'questionPack' in session && session.questionPack
                      ? (session.questionPack as any).name
                      : 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{session.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(session.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant="large"
            onClick={handleStartGame}
            disabled={players.length === 0 || isStarting}
          >
            {isStarting ? 'Starting Game...' : 'Start Game'}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Share the game code with players so they can join!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Players can join at{' '}
            <span className="font-mono text-blue-600">
              {window.location.origin}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
