export interface Game {
  id: string;
  sessionCode: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  createdAt: Date;
  updatedAt: Date;
}