import { useState, useCallback, useRef } from 'react';
import { Context, GameConfig, memoryGameBandit } from '@/lib/contextualBandit';

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
}

export const useGameAnalytics = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const currentSession = useRef<GameSession | null>(null);
  const clickTimes = useRef<number[]>([]);
  const correctMoves = useRef<number>(0);
  const totalMoves = useRef<number>(0);

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
      speed: 0
    };
    clickTimes.current = [];
    correctMoves.current = 0;
    totalMoves.current = 0;
  }, []);

  const recordMove = useCallback((isCorrect: boolean, timestamp?: number) => {
    if (!currentSession.current) return;

    const moveTime = timestamp || Date.now();
    clickTimes.current.push(moveTime);
    totalMoves.current++;
    
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

  const endSession = useCallback((completed: boolean, timeLeft: number) => {
    if (!currentSession.current) return;

    const endTime = Date.now();
    const sessionDuration = endTime - currentSession.current.startTime;
    const avgClickInterval = clickTimes.current.length > 1 
      ? clickTimes.current.reduce((acc, time, i) => 
          i > 0 ? acc + (time - clickTimes.current[i-1]) : acc, 0) / (clickTimes.current.length - 1)
      : 1000;

    currentSession.current.endTime = endTime;
    currentSession.current.completed = completed;
    currentSession.current.timeLeft = timeLeft;
    currentSession.current.accuracy = totalMoves.current > 0 ? correctMoves.current / totalMoves.current : 0;
    currentSession.current.speed = Math.min(1, 2000 / avgClickInterval); // Normalize speed

    setSessions(prev => [...prev.slice(-19), currentSession.current!]); // Keep last 20 sessions
    return currentSession.current;
  }, []);

  const getContext = useCallback((level: number): Context => {
    const recentSessions = sessions.slice(-5);
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: Context['timeOfDay'] = 'afternoon';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour >= 18) timeOfDay = 'evening';

    const recentAccuracy = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
      : 0.5;

    const recentSpeed = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.speed, 0) / recentSessions.length
      : 0.5;

    const sessionLength = sessions.length > 0 
      ? (Date.now() - sessions[0].startTime) / 1000 
      : 0;

    const streakCount = calculateStreak();
    const userType = memoryGameBandit.analyzePlaystyle(recentSessions);

    return {
      currentLevel: level,
      recentAccuracy,
      recentSpeed,
      sessionLength,
      timeOfDay,
      previousDifficulty: recentSessions.length > 0 ? recentSessions[recentSessions.length - 1].level / 25 : 0.1,
      streakCount,
      userType
    };
  }, [sessions]);

  const calculateStreak = useCallback(() => {
    let streak = 0;
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].completed && sessions[i].accuracy > 0.7) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  const calculateEngagement = useCallback((session: GameSession) => {
    const targetDuration = 120000; // 2 minutes
    const actualDuration = (session.endTime || Date.now()) - session.startTime;
    const durationScore = Math.min(1, actualDuration / targetDuration);
    
    const consistencyScore = session.clickPattern.length > 5
      ? 1 - (Math.max(...session.clickPattern) - Math.min(...session.clickPattern)) / Math.max(...session.clickPattern)
      : 0.5;
    
    return (durationScore + consistencyScore + (session.completed ? 1 : 0)) / 3;
  }, []);

  const calculateFrustration = useCallback((session: GameSession) => {
    const expectedMoves = session.matches * 2;
    const excessMoves = Math.max(0, session.moves - expectedMoves);
    const frustrationScore = Math.min(1, excessMoves / expectedMoves);
    
    const timeoutFrustration = session.completed ? 0 : 0.5;
    
    return (frustrationScore + timeoutFrustration) / 2;
  }, []);

  const updateBandit = useCallback((context: Context, config: GameConfig, session: GameSession) => {
    const engagement = calculateEngagement(session);
    const frustration = calculateFrustration(session);
    
    const performance = {
      completed: session.completed,
      accuracy: session.accuracy,
      timeEfficiency: session.timeLeft / 120, // Assuming max 120 seconds
      engagement,
      frustration
    };

    // Calculate reward and update bandit
    const reward = calculateReward(performance);
    memoryGameBandit.updateModel(context, config, reward);
    
    return { performance, reward };
  }, [calculateEngagement, calculateFrustration]);

  const calculateReward = (performance: {
    completed: boolean;
    accuracy: number;
    timeEfficiency: number;
    engagement: number;
    frustration: number;
  }): number => {
    const { completed, accuracy, timeEfficiency, engagement, frustration } = performance;
    
    let reward = 0;
    if (completed) reward += 50;
    reward += accuracy * 30;
    reward += timeEfficiency * 20;
    reward += engagement * 15;
    reward -= frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  };

  return {
    startSession,
    recordMove,
    recordMatch,
    endSession,
    getContext,
    updateBandit,
    sessions,
    getStreak: calculateStreak,
    getCurrentSession: () => currentSession.current
  };
};