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
        <p className="text-gray-500">Loading question packs...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="heading text-center mb-8">Create New Game</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Question Pack</h2>
            {questionPacks.length === 0 ? (
              <p className="text-gray-500">No question packs available</p>
            ) : (
              <div className="grid gap-4">
                {questionPacks.map((pack) => (
                  <Card
                    key={pack.id}
                    className={`cursor-pointer transition-all ${
                      selectedPackId === pack.id
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPackId(pack.id)}
                  >
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">
                        {pack.name}
                      </h3>
                      {pack.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {pack.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{pack.questionCount} questions</span>
                        {pack.difficulty && (
                          <span className="capitalize">{pack.difficulty}</span>
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
