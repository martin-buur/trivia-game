export interface Question {
  id: string;
  packId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  timeLimit: number;
  points: number;
  order: number;
}

export interface QuestionPack {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  questionCount: number;
  createdAt: Date;
}
