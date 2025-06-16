export interface Session {
  id: string;
  code: string;
  hostDeviceId: string;
  questionPackId: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
