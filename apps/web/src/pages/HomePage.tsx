import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { api, useApi } from '@/lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const { loading: creating } = useApi();
  const { execute: checkSession, loading: checking } = useApi();

  const handleCreateGame = async () => {
    navigate('/create');
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) return;

    try {
      // Check if session exists
      await checkSession(api.sessions.get(joinCode.toUpperCase()));
      navigate(`/play/${joinCode.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      // In a real app, show error message
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-slide-up">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-primary mb-2 sm:mb-3 lg:mb-4">
            Trivia Game
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 px-4 sm:px-0">
            Challenge your friends in real-time!
          </p>
        </div>

        {/* Main Card */}
        <Card
          variant="floating"
          animate
          className="text-center p-6 sm:p-8 lg:p-10"
        >
          {/* Host Character Placeholder */}
          <div className="relative mx-auto w-32 sm:w-40 lg:w-48 mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto rounded-full bg-gradient-to-br from-accent-orange to-accent-pink shadow-2xl shadow-accent-orange/50 animate-bounce-slow"></div>
            <div className="absolute -top-12 sm:-top-14 lg:-top-16 left-1/2 -translate-x-1/2 bg-white rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-6 sm:py-3 shadow-xl animate-pulse-slow whitespace-nowrap">
              <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">
                Ready to play?
              </p>
            </div>
          </div>

          {!showJoinInput ? (
            <div className="space-y-4">
              <Button
                variant="large"
                fullWidth
                onClick={handleCreateGame}
                disabled={creating}
              >
                Create Game
              </Button>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowJoinInput(true)}
              >
                Join Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-pop-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                Enter Game Code
              </h2>

              <Input
                variant="code"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                maxLength={6}
                autoFocus
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowJoinInput(false);
                    setJoinCode('');
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleJoinGame}
                  disabled={!joinCode.trim() || checking}
                >
                  Join
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center mt-6 sm:mt-8 text-sm sm:text-base text-gray-600 px-4 sm:px-0">
          Play on your phone • Host on your computer
        </p>
      </div>
    </div>
  );
}
