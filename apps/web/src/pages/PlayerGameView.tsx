import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { getDeviceId } from '@trivia/utils';
import { useGameSocket } from '@/hooks/useGameSocket';
import type { Question, QuestionRevealedEvent, GameFinishedEvent, QuestionCompletedEvent, AnswerRevealedEvent } from '@trivia/types';

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
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);

  const deviceId = getDeviceId();

  // WebSocket connection for real-time updates
  const { connectionState, subscribe } = useGameSocket({
    sessionCode: code || '',
    deviceId,
    isHost: false,
    autoReconnect: true
  });

  // Handle new question revealed
  useEffect(() => {
    const unsubscribe = subscribe('question_revealed', (event) => {
      const questionEvent = event as QuestionRevealedEvent;
      const newQuestion: Question = {
        id: questionEvent.data.question.id,
        question: questionEvent.data.question.text,
        options: questionEvent.data.question.options,
        timeLimit: questionEvent.data.question.timeLimit,
        correctAnswerIndex: -1, // Players don't see correct answer
        packId: '', // Not needed for display
        points: 100, // Default points
        order: 1 // Not needed for display
      };
      
      setCurrentQuestion(newQuestion);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowResult(false);
      setTimeLeft(questionEvent.data.question.timeLimit);
      setCorrectAnswerIndex(null);
    });
    return unsubscribe;
  }, [subscribe]);

  // Handle answer revealed
  useEffect(() => {
    const unsubscribe = subscribe('answer_revealed', (event) => {
      const revealedEvent = event as AnswerRevealedEvent;
      setCorrectAnswerIndex(revealedEvent.data.correctAnswerIndex);
      setShowResult(true);
      
      // Find this player's result
      const playerResult = revealedEvent.data.playerResults.find(
        p => p.playerId === deviceId
      );
      
      if (playerResult) {
        setIsCorrect(playerResult.isCorrect);
        setTotalScore(playerResult.totalScore);
        if (!hasAnswered && playerResult.hasAnswered) {
          // Server-side timeout occurred
          setHasAnswered(true);
        }
      }
    });
    return unsubscribe;
  }, [subscribe, deviceId, hasAnswered]);

  // Handle question completed (show results)
  useEffect(() => {
    const unsubscribe = subscribe('question_completed', (event) => {
      const completedEvent = event as QuestionCompletedEvent;
      const playerScore = completedEvent.data.scores.find(s => s.playerId === deviceId);
      
      if (playerScore) {
        setIsCorrect(playerScore.isCorrect);
        setPointsEarned(playerScore.score - totalScore);
        setTotalScore(playerScore.score);
        setShowResult(true);
        
        // Check if this player timed out (server-side timeout)
        const timedOut = completedEvent.data.timeoutPlayers?.includes(deviceId);
        if (timedOut && !hasAnswered) {
          setHasAnswered(true); // Mark as answered due to timeout
        }
      }
    });
    return unsubscribe;
  }, [subscribe, deviceId, totalScore, hasAnswered]);

  // Handle game finished
  useEffect(() => {
    const unsubscribe = subscribe('game_finished', (event) => {
      const gameFinishedEvent = event as GameFinishedEvent;
      console.log('Game finished, navigating to results...', gameFinishedEvent);
      navigate(`/play/${code}/results`);
    });
    return unsubscribe;
  }, [subscribe, navigate, code]);

  // Load initial question state
  useEffect(() => {
    if (!code) return;

    const fetchQuestion = async () => {
      try {
        const question = await api.game.getCurrentQuestion(code);
        setCurrentQuestion(question);
        setTimeLeft(question.timeLimit || 30);

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
  }, [code, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!hasAnswered && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    // Note: When timeLeft reaches 0, server will handle timeout automatically
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
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' : 
                connectionState === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <p className="text-xs text-muted-foreground capitalize">{connectionState}</p>
            </div>
            <p className="text-sm text-muted-foreground">Game Code: {code}</p>
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
            {currentQuestion.options.map((option, index) => {
              const isSelectedAnswer = selectedAnswer === index;
              const isCorrectAnswer = correctAnswerIndex === index;
              
              // Determine button styling based on state
              let buttonClassName = "w-full justify-start text-left p-6";
              let variant: 'primary' | 'secondary' | 'outline' = 'secondary';
              
              if (correctAnswerIndex !== null) {
                // Answer has been revealed
                if (isCorrectAnswer) {
                  buttonClassName += " border-green-500 bg-green-100 dark:bg-green-900/30";
                } else if (isSelectedAnswer && !isCorrectAnswer) {
                  buttonClassName += " border-red-500 bg-red-100 dark:bg-red-900/30";
                }
              } else if (isSelectedAnswer) {
                // Answer not revealed yet, but this is selected
                variant = 'primary';
              }
              
              return (
                <Button
                  key={index}
                  variant={variant}
                  className={buttonClassName}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={hasAnswered}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${
                          correctAnswerIndex !== null && isCorrectAnswer
                            ? 'bg-green-500 text-white'
                            : correctAnswerIndex !== null && isSelectedAnswer && !isCorrectAnswer
                            ? 'bg-red-500 text-white'
                            : isSelectedAnswer
                            ? 'bg-white text-primary'
                            : 'bg-muted'
                        }
                      `}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {correctAnswerIndex !== null && isCorrectAnswer && (
                      <span className="text-green-600 font-semibold">✓ Correct</span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Result Message */}
          {showResult && (
            <div className="mt-6 text-center">
              <p
                className={`text-lg font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
              >
                {isCorrect ? 'Correct!' : !hasAnswered || selectedAnswer === null ? 'Time\'s up!' : 'Incorrect'}
              </p>
              <p className="text-muted-foreground">
                {isCorrect
                  ? `+${pointsEarned} points`
                  : !hasAnswered || selectedAnswer === null
                  ? 'You ran out of time'
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
