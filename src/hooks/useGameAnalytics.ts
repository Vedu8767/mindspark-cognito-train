import { useState, useCallback, useRef } from 'react';
import { UserContext, GameAction, PerformanceMetrics, memoryGameBandit } from '@/lib/bandit';

interface GameSession {
  startTime: number;
  endTime?: number;
  level: number;
  moves: number;
  matches: number;
  timeLeft: number;
  completed: boolean;
  clickPattern: number[];
  accuracy: number;
  speed: number;
  avgReactionTime: number;
}

export const useGameAnalytics = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const currentSession = useRef<GameSession | null>(null);
  const clickTimes = useRef<number[]>([]);
  const correctMoves = useRef<number>(0);
  const totalMoves = useRef<number>(0);
  const reactionTimes = useRef<number[]>([]);
  const lastClickTime = useRef<number>(0);

  const startSession = useCallback((level: number) => {
    currentSession.current = {
      startTime: Date.now(),
      level,
      moves: 0,
      matches: 0,
      timeLeft: 0,
      completed: false,
      clickPattern: [],
      accuracy: 0,
      speed: 0,
      avgReactionTime: 0
    };
    clickTimes.current = [];
    reactionTimes.current = [];
    correctMoves.current = 0;
    totalMoves.current = 0;
    lastClickTime.current = Date.now();
    
    console.log('[Analytics] Session started for level', level);
  }, []);

  const recordMove = useCallback((isCorrect: boolean, timestamp?: number) => {
    if (!currentSession.current) return;

    const moveTime = timestamp || Date.now();
    clickTimes.current.push(moveTime);
    totalMoves.current++;
    
    // Track reaction time
    if (lastClickTime.current) {
      reactionTimes.current.push(moveTime - lastClickTime.current);
    }
    lastClickTime.current = moveTime;
    
    if (isCorrect) {
      correctMoves.current++;
    }

    currentSession.current.moves++;
    currentSession.current.clickPattern.push(moveTime - currentSession.current.startTime);
  }, []);

  const recordMatch = useCallback(() => {
    if (!currentSession.current) return;
    currentSession.current.matches++;
  }, []);

  const endSession = useCallback((completed: boolean, timeLeft: number): GameSession | null => {
    if (!currentSession.current) {
      console.log('[Analytics] No current session to end');
      return null;
    }

    const endTime = Date.now();
    const sessionDuration = endTime - currentSession.current.startTime;
    
    // Calculate average click interval
    const avgClickInterval = clickTimes.current.length > 1 
      ? clickTimes.current.reduce((acc, time, i) => 
          i > 0 ? acc + (time - clickTimes.current[i-1]) : acc, 0) / (clickTimes.current.length - 1)
      : 1000;
    
    // Calculate average reaction time
    const avgReactionTime = reactionTimes.current.length > 0
      ? reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length
      : 1000;

    currentSession.current.endTime = endTime;
    currentSession.current.completed = completed;
    currentSession.current.timeLeft = timeLeft;
    currentSession.current.accuracy = totalMoves.current > 0 ? correctMoves.current / totalMoves.current : 0;
    currentSession.current.speed = Math.min(1, 2000 / avgClickInterval);
    currentSession.current.avgReactionTime = avgReactionTime;

    console.log('[Analytics] Session ended:', {
      completed,
      accuracy: currentSession.current.accuracy.toFixed(2),
      speed: currentSession.current.speed.toFixed(2),
      moves: currentSession.current.moves,
      matches: currentSession.current.matches,
      avgReactionTime: avgReactionTime.toFixed(0)
    });

    const session = currentSession.current;
    setSessions(prev => [...prev.slice(-19), session]);
    return session;
  }, []);

  const getContext = useCallback((level: number): UserContext => {
    const recentSessions = sessions.slice(-5);
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: UserContext['timeOfDay'] = 'afternoon';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour >= 18) timeOfDay = 'evening';

    // Calculate performance metrics from recent sessions
    const recentAccuracy = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
      : 0.5;

    const recentSpeed = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.speed, 0) / recentSessions.length
      : 0.5;

    const sessionLength = sessions.length > 0 
      ? (Date.now() - sessions[0].startTime) / 1000 
      : 0;

    const successRate = recentSessions.length > 0
      ? recentSessions.filter(s => s.completed).length / recentSessions.length
      : 0.5;

    const avgMoveTime = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.avgReactionTime, 0) / recentSessions.length
      : 1000;

    const streakCount = calculateStreak();
    const userType = memoryGameBandit.analyzePlaystyle(recentSessions);
    
    // Calculate frustration and engagement levels
    const frustrationLevel = calculateFrustrationLevel(recentSessions);
    const engagementLevel = calculateEngagementLevel(recentSessions);
    
    // Preferred grid size based on best performance
    const preferredGridSize = getPreferredGridSize();

    return {
      currentLevel: level,
      recentAccuracy,
      recentSpeed,
      sessionLength,
      timeOfDay,
      previousDifficulty: recentSessions.length > 0 ? recentSessions[recentSessions.length - 1].level / 25 : 0.1,
      streakCount,
      userType,
      avgMoveTime,
      frustrationLevel,
      engagementLevel,
      preferredGridSize,
      successRate,
      dayOfWeek: now.getDay()
    };
  }, [sessions]);

  const calculateStreak = useCallback(() => {
    let streak = 0;
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].completed && sessions[i].accuracy > 0.6) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  const calculateFrustrationLevel = (recentSessions: GameSession[]): number => {
    if (recentSessions.length === 0) return 0;
    
    let frustration = 0;
    
    recentSessions.forEach(session => {
      // Incomplete games indicate frustration
      if (!session.completed) frustration += 0.3;
      
      // Low accuracy indicates struggling
      if (session.accuracy < 0.4) frustration += 0.2;
      
      // Many excess moves indicate frustration
      const expectedMoves = session.matches * 2;
      const excessMoves = Math.max(0, session.moves - expectedMoves);
      frustration += Math.min(0.3, excessMoves / 20);
    });
    
    return Math.min(1, frustration / recentSessions.length);
  };

  const calculateEngagementLevel = (recentSessions: GameSession[]): number => {
    if (recentSessions.length === 0) return 0.5;
    
    let engagement = 0;
    
    recentSessions.forEach(session => {
      // Completed games show engagement
      if (session.completed) engagement += 0.4;
      
      // Good accuracy shows focus
      engagement += session.accuracy * 0.3;
      
      // Consistent click pattern shows focus
      if (session.clickPattern.length > 3) {
        const consistency = calculateClickConsistency(session.clickPattern);
        engagement += consistency * 0.3;
      }
    });
    
    return Math.min(1, engagement / recentSessions.length);
  };

  const calculateClickConsistency = (pattern: number[]): number => {
    if (pattern.length < 3) return 0.5;
    
    const intervals: number[] = [];
    for (let i = 1; i < pattern.length; i++) {
      intervals.push(pattern[i] - pattern[i-1]);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower coefficient of variation = more consistent
    const cv = mean > 0 ? stdDev / mean : 1;
    return Math.max(0, 1 - cv);
  };

  const getPreferredGridSize = (): number => {
    const completedSessions = sessions.filter(s => s.completed && s.accuracy > 0.7);
    if (completedSessions.length === 0) return 4;
    
    // Weight recent sessions more heavily
    const weightedSum = completedSessions.reduce((sum, s, i) => {
      const weight = 1 + i * 0.1;
      const gridSize = Math.min(4 + Math.floor((s.level - 1) / 3), 8);
      return sum + gridSize * weight;
    }, 0);
    
    const totalWeight = completedSessions.reduce((sum, _, i) => sum + 1 + i * 0.1, 0);
    
    return Math.round(weightedSum / totalWeight);
  };

  const updateBandit = useCallback((context: UserContext, config: GameAction, session: GameSession) => {
    const engagement = calculateEngagementLevel([session]);
    const frustration = calculateFrustrationLevel([session]);
    
    const metrics: PerformanceMetrics = {
      completed: session.completed,
      accuracy: session.accuracy,
      timeEfficiency: session.timeLeft / 120,
      engagement,
      frustration,
      optimalMoves: session.matches * 2,
      actualMoves: session.moves,
      avgReactionTime: session.avgReactionTime
    };

    // Calculate reward using bandit
    const reward = memoryGameBandit.calculateReward(metrics);
    
    // Update the bandit model
    memoryGameBandit.updateModel(context, config, reward, metrics);
    
    console.log('[Analytics] Bandit updated with reward:', reward.toFixed(1));
    
    return { performance: metrics, reward };
  }, []);

  const getBanditStats = useCallback(() => {
    return memoryGameBandit.getStats();
  }, []);

  return {
    startSession,
    recordMove,
    recordMatch,
    endSession,
    getContext,
    updateBandit,
    getBanditStats,
    sessions,
    getStreak: calculateStreak,
    getCurrentSession: () => currentSession.current
  };
};
