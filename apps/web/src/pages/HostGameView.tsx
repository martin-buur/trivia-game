import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, useApi } from '@/lib/api';
import { getDeviceId } from '@trivia/utils';
import type { Question, Player } from '@trivia/types';

export function HostGameView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(
    new Set()
  );
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const { execute: nextQuestion, loading: loadingNext } = useApi<{
    hasNext: boolean;
    question?: Question;
    session?: { status: string };
  }>();

  const hostDeviceId = getDeviceId();

  // Fetch current question and session details
  useEffect(() => {
    if (!code) return;

    const fetchGameState = async () => {
      try {
        // Get current question with answer (for host)
        const question = await api.game.getCurrentQuestion(code, true);
        setCurrentQuestion(question);

        // Get session details to know total questions
        const session = await api.sessions.get(code);
        // @ts-expect-error - questionPack is populated in the response
        setTotalQuestions(session.questionPack?.questionCount || 0);

        // Get current scores
        const { players } = await api.game.getScores(code);
        setPlayers(players);

        // Get answer status for current question
        try {
          const answerStatus = await api.game.getAnswerStatus(code);
          const answeredPlayerIds = new Set(
            answerStatus.answeredPlayers.map(p => p.id)
          );
          setAnsweredPlayers(answeredPlayerIds);
        } catch (answerError) {
          // If no current question yet, ignore the error
          console.debug('No answer status available yet:', answerError);
        }
      } catch (error) {
        console.error('Error fetching game state:', error);
      }
    };

    fetchGameState();
    // Poll for updates
    const interval = window.setInterval(fetchGameState, 2000);
    return () => window.clearInterval(interval);
  }, [code]);

  // Reset answered players when question changes
  useEffect(() => {
    setAnsweredPlayers(new Set());
    setShowingAnswer(false);
  }, [currentQuestion?.id]);

  const handleRevealAnswer = () => {
    setShowingAnswer(true);
  };

  const handleNextQuestion = async () => {
    if (!code) return;

    try {
      const result = await nextQuestion(
        api.game.nextQuestion(code, hostDeviceId)
      );

      if (result.hasNext && result.question) {
        setCurrentQuestion(result.question);
        setQuestionNumber((prev) => prev + 1);
        setShowingAnswer(false);
        setAnsweredPlayers(new Set());
      } else {
        // Game ended, navigate to final scores
        navigate(`/host/${code}/results`);
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading question...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Game Code: {code}</h1>
            <p className="text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Players answered</p>
            <p className="text-2xl font-bold">
              {answeredPlayers.size} / {players.length}
            </p>
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            {currentQuestion.question}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${
                    showingAnswer &&
                    index === currentQuestion.correctAnswerIndex
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-border'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                      ${
                        showingAnswer &&
                        index === currentQuestion.correctAnswerIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-muted'
                      }
                    `}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <p className="text-lg flex-1">{option}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {!showingAnswer ? (
              <Button
                variant="large"
                onClick={handleRevealAnswer}
                disabled={answeredPlayers.size === 0}
              >
                Reveal Answer
              </Button>
            ) : (
              <Button
                variant="large"
                onClick={handleNextQuestion}
                disabled={loadingNext}
              >
                {questionNumber < totalQuestions ? 'Next Question' : 'End Game'}
              </Button>
            )}
          </div>
        </Card>

        {/* Player List */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Players</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-2 h-2 rounded-full
                          ${answeredPlayers.has(player.id) ? 'bg-green-500' : 'bg-gray-400'}
                        `}
                      />
                      <span className="font-medium">{player.nickname}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {player.score} pts
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
