import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { getDeviceId } from '@trivia/utils';
import type { Question } from '@trivia/types';

export function PlayerGameView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [, setGameStatus] = useState<string>('playing');
  const [timeLeft, setTimeLeft] = useState(0);

  const deviceId = getDeviceId();

  // Fetch current question
  useEffect(() => {
    if (!code) return;

    const fetchQuestion = async () => {
      try {
        const question = await api.game.getCurrentQuestion(code);

        // Check if question changed
        if (question.id !== currentQuestion?.id) {
          setCurrentQuestion(question);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setShowResult(false);
          setTimeLeft(question.timeLimit || 30);
        }

        // Check game status
        const { gameStatus: status } = await api.game.getScores(code);
        setGameStatus(status);

        if (status === 'finished') {
          navigate(`/play/${code}/results`);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      }
    };

    fetchQuestion();
    const interval = window.setInterval(fetchQuestion, 2000);
    return () => window.clearInterval(interval);
  }, [code, currentQuestion?.id, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!hasAnswered && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, hasAnswered]);

  const handleAnswerSelect = async (answerIndex: number) => {
    if (hasAnswered || !code || !currentQuestion) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    try {
      const result = await api.game.submitAnswer(code, deviceId, answerIndex);
      setIsCorrect(result.correct);
      setPointsEarned(result.pointsEarned);
      setTotalScore(result.totalScore);
      setShowResult(true);
    } catch (error) {
      // If already answered, just mark as answered
      if (
        error instanceof ApiError &&
        error.status === 400 &&
        error.message?.includes('Already answered')
      ) {
        setHasAnswered(true);
      } else {
        console.error('Error submitting answer:', error);
      }
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Waiting for question...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Timer and Score */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Time left</p>
            <p
              className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500' : ''}`}
            >
              {timeLeft}s
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="text-2xl font-bold">{totalScore} pts</p>
          </div>
        </div>

        {/* Question */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === index
                    ? 'primary'
                    : 'secondary'
                }
                className="w-full justify-start text-left p-6"
                onClick={() => handleAnswerSelect(index)}
                disabled={hasAnswered}
              >
                <div className="flex items-center gap-4 w-full">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${
                        selectedAnswer === index
                          ? 'bg-white text-primary'
                          : 'bg-muted'
                      }
                    `}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Result Message */}
          {showResult && (
            <div className="mt-6 text-center">
              <p
                className={`text-lg font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
              >
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="text-muted-foreground">
                {isCorrect
                  ? `+${pointsEarned} points`
                  : 'Better luck next time'}
              </p>
            </div>
          )}

          {/* Waiting Message */}
          {hasAnswered && !showResult && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Answer submitted! Waiting for results...
              </p>
            </div>
          )}
        </Card>

        {/* Instructions */}
        {!hasAnswered && (
          <p className="text-center text-muted-foreground">
            Select your answer before time runs out!
          </p>
        )}
      </div>
    </div>
  );
}
