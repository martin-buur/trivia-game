import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Player } from '@trivia/types';

interface GameOverViewProps {
  isHost?: boolean;
}

export function GameOverView({ isHost = false }: GameOverViewProps) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const fetchFinalScores = async () => {
      try {
        const { players } = await api.game.getScores(code);
        setPlayers(players.sort((a, b) => b.score - a.score));
      } catch (error) {
        console.error('Error fetching final scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalScores();
  }, [code]);

  const handlePlayAgain = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading final results...</p>
          </div>
        </Card>
      </div>
    );
  }

  const topThree = players.slice(0, 3);
  const winner = topThree[0];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <p className="text-xl text-muted-foreground">
            {isHost ? `Game Code: ${code}` : 'Thanks for playing!'}
          </p>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <Card className="p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-2">{winner.nickname}</h2>
              <p className="text-2xl text-muted-foreground">
                {winner.score} points
              </p>
            </div>
          </Card>
        )}

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 items-end">
          {/* 2nd Place */}
          {topThree[1] && (
            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">🥈</div>
              <p className="text-lg font-semibold">{topThree[1].nickname}</p>
              <p className="text-muted-foreground">{topThree[1].score} pts</p>
            </Card>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <Card className="p-8 text-center transform scale-110">
              <div className="text-4xl mb-2">🥇</div>
              <p className="text-xl font-bold">{topThree[0].nickname}</p>
              <p className="text-lg text-muted-foreground">
                {topThree[0].score} pts
              </p>
            </Card>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">🥉</div>
              <p className="text-lg font-semibold">{topThree[2].nickname}</p>
              <p className="text-muted-foreground">{topThree[2].score} pts</p>
            </Card>
          )}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Full Leaderboard</h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{player.nickname}</span>
                  </div>
                  <span className="font-bold">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="large" onClick={handlePlayAgain}>
            {isHost ? 'Create New Game' : 'Play Again'}
          </Button>
        </div>
      </div>
    </div>
  );
}
