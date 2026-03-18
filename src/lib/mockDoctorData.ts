// Mock data for doctor dashboard

export interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  avatar?: string;
  condition: 'mild' | 'moderate' | 'severe';
  riskLevel: 'low' | 'medium' | 'high';
  enrolledDate: string;
  lastActive: string;
  cognitiveAge: number;
  currentStreak: number;
  totalSessions: number;
  overallScore: number;
  domainScores: {
    memory: number;
    attention: number;
    executive: number;
    processing: number;
  };
  recentTrend: 'improving' | 'stable' | 'declining';
  assignedPlan?: string;
  alerts: PatientAlert[];
}

export interface PatientAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: 'decline' | 'inactivity' | 'milestone' | 'missed_session';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface TrainingPlan {
  id: string;
  name: string;
  patientId: string;
  patientName: string;
  games: TrainingPlanGame[];
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
}

export interface TrainingPlanGame {
  gameId: string;
  gameName: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  sessionsPerWeek: number;
}

export interface SessionRecord {
  date: string;
  game: string;
  domain: string;
  score: number;
  duration: number; // minutes
  difficulty: string;
}

export interface WeeklyScore {
  week: string;
  memory: number;
  attention: number;
  executive: number;
  processing: number;
  overall: number;
}

export const AVAILABLE_GAMES = [
  { id: 'memory-matching', name: 'Memory Matching', domain: 'memory' },
  { id: 'word-memory', name: 'Word Memory', domain: 'memory' },
  { id: 'audio-memory', name: 'Audio Memory', domain: 'memory' },
  { id: 'spatial-navigation', name: 'Spatial Navigation', domain: 'memory' },
  { id: 'attention-focus', name: 'Attention Focus', domain: 'attention' },
  { id: 'reaction-speed', name: 'Reaction Speed', domain: 'processing' },
  { id: 'processing-speed', name: 'Processing Speed', domain: 'processing' },
  { id: 'visual-processing', name: 'Visual Processing', domain: 'processing' },
  { id: 'pattern-recognition', name: 'Pattern Recognition', domain: 'executive' },
  { id: 'math-challenge', name: 'Math Challenge', domain: 'executive' },
  { id: 'executive-function', name: 'Executive Function', domain: 'executive' },
  { id: 'tower-of-hanoi', name: 'Tower of Hanoi', domain: 'executive' },
];

export const mockPatients: Patient[] = [
  {
    id: 'p1', name: 'Mrs. Sharma', age: 68, email: 'sharma@email.com',
    condition: 'mild', riskLevel: 'low', enrolledDate: '2025-11-15', lastActive: '2026-03-16',
    cognitiveAge: 62, currentStreak: 12, totalSessions: 87, overallScore: 78,
    domainScores: { memory: 75, attention: 82, executive: 74, processing: 80 },
    recentTrend: 'improving', assignedPlan: 'plan-1',
    alerts: [],
  },
  {
    id: 'p2', name: 'Mr. Patel', age: 72, email: 'patel@email.com',
    condition: 'moderate', riskLevel: 'medium', enrolledDate: '2025-10-01', lastActive: '2026-03-14',
    cognitiveAge: 74, currentStreak: 3, totalSessions: 52, overallScore: 61,
    domainScores: { memory: 55, attention: 68, executive: 60, processing: 62 },
    recentTrend: 'stable', assignedPlan: 'plan-2',
    alerts: [],
  },
  {
    id: 'p3', name: 'Mrs. Gupta', age: 65, email: 'gupta@email.com',
    condition: 'mild', riskLevel: 'low', enrolledDate: '2026-01-10', lastActive: '2026-03-17',
    cognitiveAge: 58, currentStreak: 22, totalSessions: 104, overallScore: 85,
    domainScores: { memory: 88, attention: 84, executive: 82, processing: 86 },
    recentTrend: 'improving',
    alerts: [],
  },
  {
    id: 'p4', name: 'Mr. Singh', age: 75, email: 'singh@email.com',
    condition: 'moderate', riskLevel: 'high', enrolledDate: '2025-09-20', lastActive: '2026-03-10',
    cognitiveAge: 80, currentStreak: 0, totalSessions: 34, overallScore: 48,
    domainScores: { memory: 42, attention: 50, executive: 48, processing: 52 },
    recentTrend: 'declining',
    alerts: [],
  },
  {
    id: 'p5', name: 'Mrs. Reddy', age: 70, email: 'reddy@email.com',
    condition: 'severe', riskLevel: 'high', enrolledDate: '2025-12-05', lastActive: '2026-03-08',
    cognitiveAge: 78, currentStreak: 0, totalSessions: 28, overallScore: 42,
    domainScores: { memory: 38, attention: 45, executive: 40, processing: 44 },
    recentTrend: 'declining',
    alerts: [],
  },
  {
    id: 'p6', name: 'Mr. Kumar', age: 63, email: 'kumar@email.com',
    condition: 'mild', riskLevel: 'low', enrolledDate: '2026-02-01', lastActive: '2026-03-16',
    cognitiveAge: 57, currentStreak: 8, totalSessions: 42, overallScore: 82,
    domainScores: { memory: 80, attention: 85, executive: 78, processing: 84 },
    recentTrend: 'improving', assignedPlan: 'plan-3',
    alerts: [],
  },
];

export const mockAlerts: PatientAlert[] = [
  { id: 'a1', patientId: 'p4', patientName: 'Mr. Singh', type: 'decline', severity: 'high', message: 'Memory score dropped 15% over the last 2 weeks', timestamp: '2026-03-17T09:00:00', read: false },
  { id: 'a2', patientId: 'p5', patientName: 'Mrs. Reddy', type: 'inactivity', severity: 'high', message: 'No training sessions in the last 9 days', timestamp: '2026-03-17T08:30:00', read: false },
  { id: 'a3', patientId: 'p4', patientName: 'Mr. Singh', type: 'missed_session', severity: 'medium', message: 'Missed 5 scheduled sessions this week', timestamp: '2026-03-16T14:00:00', read: false },
  { id: 'a4', patientId: 'p2', patientName: 'Mr. Patel', type: 'decline', severity: 'medium', message: 'Executive function score declining steadily', timestamp: '2026-03-15T11:00:00', read: true },
  { id: 'a5', patientId: 'p3', patientName: 'Mrs. Gupta', type: 'milestone', severity: 'low', message: 'Achieved 100+ training sessions milestone!', timestamp: '2026-03-14T16:00:00', read: true },
  { id: 'a6', patientId: 'p1', patientName: 'Mrs. Sharma', type: 'milestone', severity: 'low', message: 'Cognitive age improved by 6 years since enrollment', timestamp: '2026-03-13T10:00:00', read: true },
];

export const mockTrainingPlans: TrainingPlan[] = [
  {
    id: 'plan-1', name: 'Memory Enhancement Plan', patientId: 'p1', patientName: 'Mrs. Sharma',
    frequency: '5 sessions/week', startDate: '2026-02-01', status: 'active',
    notes: 'Focus on memory domain with adaptive difficulty',
    games: [
      { gameId: 'memory-matching', gameName: 'Memory Matching', domain: 'memory', difficulty: 'adaptive', sessionsPerWeek: 3 },
      { gameId: 'word-memory', gameName: 'Word Memory', domain: 'memory', difficulty: 'medium', sessionsPerWeek: 2 },
      { gameId: 'attention-focus', gameName: 'Attention Focus', domain: 'attention', difficulty: 'adaptive', sessionsPerWeek: 2 },
    ],
  },
  {
    id: 'plan-2', name: 'Comprehensive Cognitive Support', patientId: 'p2', patientName: 'Mr. Patel',
    frequency: '4 sessions/week', startDate: '2026-01-15', status: 'active',
    notes: 'Balanced plan across all domains, keep difficulty moderate',
    games: [
      { gameId: 'memory-matching', gameName: 'Memory Matching', domain: 'memory', difficulty: 'easy', sessionsPerWeek: 1 },
      { gameId: 'attention-focus', gameName: 'Attention Focus', domain: 'attention', difficulty: 'easy', sessionsPerWeek: 1 },
      { gameId: 'pattern-recognition', gameName: 'Pattern Recognition', domain: 'executive', difficulty: 'medium', sessionsPerWeek: 1 },
      { gameId: 'processing-speed', gameName: 'Processing Speed', domain: 'processing', difficulty: 'easy', sessionsPerWeek: 1 },
    ],
  },
  {
    id: 'plan-3', name: 'Executive Function Focus', patientId: 'p6', patientName: 'Mr. Kumar',
    frequency: '4 sessions/week', startDate: '2026-02-15', status: 'active',
    games: [
      { gameId: 'tower-of-hanoi', gameName: 'Tower of Hanoi', domain: 'executive', difficulty: 'hard', sessionsPerWeek: 2 },
      { gameId: 'executive-function', gameName: 'Executive Function', domain: 'executive', difficulty: 'adaptive', sessionsPerWeek: 2 },
    ],
  },
];

// Generate mock weekly scores for a patient (8 weeks of history)
export const generateWeeklyScores = (patientId: string): WeeklyScore[] => {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) return [];

  const weeks: WeeklyScore[] = [];
  const baseScores = { ...patient.domainScores };
  const trendMultiplier = patient.recentTrend === 'improving' ? 1 : patient.recentTrend === 'declining' ? -1 : 0;

  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - i * 7);
    const offset = (7 - i) * trendMultiplier * 2;
    const jitter = () => Math.round((Math.random() - 0.5) * 4);

    const memory = Math.min(100, Math.max(10, baseScores.memory - (7 - i) * trendMultiplier * 2 + offset + jitter()));
    const attention = Math.min(100, Math.max(10, baseScores.attention - (7 - i) * trendMultiplier * 1.5 + offset + jitter()));
    const executive = Math.min(100, Math.max(10, baseScores.executive - (7 - i) * trendMultiplier * 1.8 + offset + jitter()));
    const processing = Math.min(100, Math.max(10, baseScores.processing - (7 - i) * trendMultiplier * 1.6 + offset + jitter()));

    weeks.push({
      week: `W${i === 0 ? 'Now' : `-${i}`}`,
      memory, attention, executive, processing,
      overall: Math.round((memory + attention + executive + processing) / 4),
    });
  }
  return weeks;
};

// Generate mock session records for a patient
export const generateSessionHistory = (patientId: string): SessionRecord[] => {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) return [];

  const games = AVAILABLE_GAMES;
  const sessions: SessionRecord[] = [];
  const numSessions = Math.min(patient.totalSessions, 20); // Last 20 sessions

  for (let i = 0; i < numSessions; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i * 1.5));
    const game = games[Math.floor(Math.random() * games.length)];
    sessions.push({
      date: date.toISOString().split('T')[0],
      game: game.name,
      domain: game.domain,
      score: Math.round(patient.overallScore + (Math.random() - 0.5) * 30),
      duration: Math.round(5 + Math.random() * 15),
      difficulty: ['easy', 'medium', 'hard', 'adaptive'][Math.floor(Math.random() * 4)],
    });
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
};

// Generate cohort weekly trend data
export const generateCohortTrend = (): { week: string; avgScore: number; activePlayers: number }[] => {
  const data = [];
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - i * 7);
    data.push({
      week: `W${i === 0 ? 'Now' : `-${i}`}`,
      avgScore: Math.round(60 + Math.random() * 15 + (7 - i) * 0.8),
      activePlayers: Math.round(3 + Math.random() * 3),
    });
  }
  return data;
};
