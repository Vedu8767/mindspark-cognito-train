export interface ReportData {
  userName: string;
  reportDate: string;
  overallImprovement: string;
  trainingDays: number;
  achievements: number;
  bestScore: string;
  totalSessions: number;
  avgSessionDuration: string;
  longestStreak: number;
  currentStreak: number;
  weeklyProgress: {
    memory: string;
    attention: string;
    executive: string;
    processing: string;
  };
  detailedScores: {
    memory: { current: number; previous: number; best: number };
    attention: { current: number; previous: number; best: number };
    executive: { current: number; previous: number; best: number };
    processing: { current: number; previous: number; best: number };
  };
  gameStats: Array<{
    name: string;
    sessionsPlayed: number;
    averageScore: number;
    bestScore: number;
    timeSpent: string;
  }>;
}
