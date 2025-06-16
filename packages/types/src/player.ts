export interface Player {
  id: string;
  sessionId: string;
  deviceId: string;
  nickname: string;
  score: number;
  joinedAt: Date;
}