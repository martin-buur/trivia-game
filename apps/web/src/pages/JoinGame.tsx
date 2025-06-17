import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { api, useApi } from '@/lib/api';
import { generateDeviceId } from '@trivia/utils';
import type { Session, Player } from '@trivia/types';

export function JoinGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { execute: checkSession, loading: checking } = useApi<
    Session & { players: Player[] }
  >();
  const { execute: joinSession, loading: joining } = useApi<Player>();

  const sessionCode = code?.toUpperCase() || '';

  useEffect(() => {
    if (!sessionCode) {
      navigate('/');
      return;
    }

    // Validate session exists and is joinable
    const validateSession = async () => {
      try {
        const session = await checkSession(api.sessions.get(sessionCode));

        if (session && session.status !== 'waiting') {
          setError('This game has already started');
        }
      } catch {
        setError('Invalid game code');
      }
    };

    validateSession();
  }, [sessionCode, checkSession, navigate]);

  const handleJoin = async () => {
    if (!nickname.trim()) return;

    try {
      setError(null);
      const deviceId = generateDeviceId();

      const player = await joinSession(
        api.players.join(sessionCode, deviceId, nickname.trim())
      );

      // Store player info for future use
      if (player) {
        localStorage.setItem('playerId', player.id);
        localStorage.setItem('playerNickname', player.nickname);
        localStorage.setItem('deviceId', deviceId);
      }

      // Navigate to waiting room
      navigate(`/play/${sessionCode}`);
    } catch (err) {
      if (err instanceof Error && err.message?.includes('already in session')) {
        // Player already joined, navigate to waiting room
        navigate(`/play/${sessionCode}`);
      } else {
        setError('Failed to join game. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md sm:max-w-lg w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary mb-2">
            Join Game
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-700">
            Code: {sessionCode}
          </p>
        </div>

        {/* Join Card */}
        <Card variant="floating" animate className="p-6 sm:p-8">
          {error ? (
            <div className="text-center animate-pop-in">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <span className="text-3xl">😕</span>
                </div>
                <p className="text-lg font-semibold text-red-600 mb-2">
                  {error}
                </p>
              </div>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          ) : checking ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Checking game...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-pop-in">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent-orange to-accent-pink shadow-xl mb-4 flex items-center justify-center">
                  <span className="text-3xl">🎮</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  What&apos;s your name?
                </h2>
                <p className="text-gray-600">Choose a nickname for this game</p>
              </div>

              <Input
                variant="default"
                placeholder="Enter nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={20}
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/')}
                  disabled={joining}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleJoin}
                  disabled={!nickname.trim() || joining}
                >
                  {joining ? 'Joining...' : 'Join Game'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
