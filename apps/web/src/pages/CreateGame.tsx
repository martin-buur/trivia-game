import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { getDeviceId } from '@trivia/utils';
import type { QuestionPack } from '@trivia/types';

export function CreateGame() {
  const navigate = useNavigate();
  const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadQuestionPacks();
  }, []);

  const loadQuestionPacks = async () => {
    try {
      const packs = await api.questionPacks.list();
      setQuestionPacks(packs);
      if (packs.length > 0) {
        setSelectedPackId(packs[0].id);
      }
    } catch (err) {
      setError('Failed to load question packs');
      console.error('Error loading question packs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!selectedPackId) return;

    setIsCreating(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const session = await api.sessions.create({
        hostDeviceId: deviceId,
        questionPackId: selectedPackId,
      });

      navigate(`/host/${session.code}`);
    } catch (err) {
      setError('Failed to create game session');
      console.error('Error creating session:', err);
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading question packs...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-primary hover:text-primary-dark flex items-center gap-2 font-medium transition-colors"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-4xl font-bold text-center mb-8 text-text-primary">Create New Game</h1>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Select Question Pack</h2>
            {questionPacks.length === 0 ? (
              <p className="text-text-secondary">No question packs available</p>
            ) : (
              <div className="grid gap-4">
                {questionPacks.map((pack) => (
                  <Card
                    key={pack.id}
                    data-testid="question-pack"
                    className={`cursor-pointer transition-all card-hover ${
                      selectedPackId === pack.id
                        ? 'ring-2 ring-primary border-primary shadow-colored'
                        : 'hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedPackId(pack.id)}
                  >
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-text-primary">
                        {pack.name}
                      </h3>
                      {pack.description && (
                        <p className="text-text-secondary text-sm mb-2">
                          {pack.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-text-tertiary">
                        <span>{pack.questionCount} questions</span>
                        {pack.difficulty && (
                          <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">{pack.difficulty}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="large"
              onClick={handleCreateGame}
              disabled={!selectedPackId || isCreating}
            >
              {isCreating ? 'Creating Game...' : 'Create Game'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
