import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reactionBandit, ReactionContext, ReactionAction } from '@/lib/bandit';

interface ReactionSpeedGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Trial {
  id: number;
  delay: number;
  reactionTime?: number;
  success: boolean;
}

const ReactionSpeedGame = ({ onComplete, onExit }: ReactionSpeedGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'active' | 'result' | 'complete'>('waiting');
  const [isWaiting, setIsWaiting] = useState(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [avgReactionTime, setAvgReactionTime] = useState(0);
  const [earlyClicks, setEarlyClicks] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  
  // Bandit-controlled game config
  const [gameConfig, setGameConfig] = useState<ReactionAction | null>(null);
  const [banditStats, setBanditStats] = useState(reactionBandit.getStats());
  
  // Session tracking
  const sessionStartRef = useRef(Date.now());
  const levelStartRef = useRef(Date.now());
  const reactionTimesRef = useRef<number[]>([]);
  const bestReactionTimeRef = useRef(Infinity);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get time of day for context
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Build context for bandit
  const buildContext = useCallback((): ReactionContext => {
    const avgRT = reactionTimesRef.current.length > 0
      ? reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
      : 400;
    
    const validTrials = trials.filter(t => t.reactionTime && t.reactionTime > 0);
    const successRate = trials.length > 0 ? validTrials.length / trials.length : 0.5;
    const earlyRate = trials.length > 0 ? earlyClicks / trials.length : 0;
    
    // Calculate consistency (lower variance = more consistent)
    let consistencyScore = 0.5;
    if (reactionTimesRef.current.length >= 3) {
      const mean = avgRT;
      const variance = reactionTimesRef.current.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / reactionTimesRef.current.length;
      const stdDev = Math.sqrt(variance);
      consistencyScore = Math.max(0, 1 - stdDev / 200);
    }
    
    // Determine user type
    let userType: 'fast_reactor' | 'consistent' | 'improving' = 'consistent';
    if (avgRT < 300) userType = 'fast_reactor';
    else if (reactionTimesRef.current.length >= 5) {
      const recentAvg = reactionTimesRef.current.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlyAvg = reactionTimesRef.current.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      if (recentAvg < earlyAvg * 0.9) userType = 'improving';
    }
    
    // Calculate frustration
    const frustration = earlyRate > 0.3 ? Math.min(1, earlyRate * 2) : 0;
    const engagement = successRate > 0.7 ? Math.min(1, successRate) : 0.5;
    
    return {
      currentLevel,
      avgReactionTime: avgRT,
      recentAccuracy: successRate,
      sessionLength: (Date.now() - sessionStartRef.current) / 1000,
      timeOfDay: getTimeOfDay(),
      previousDifficulty: gameConfig?.difficultyMultiplier || 1,
      streakCount: validTrials.filter((t, i, arr) => i === 0 || arr[i-1].success).length,
      userType,
      frustrationLevel: frustration,
      engagementLevel: engagement,
      successRate,
      earlyClickRate: earlyRate,
      bestReactionTime: bestReactionTimeRef.current === Infinity ? 400 : bestReactionTimeRef.current,
      consistencyScore,
    };
  }, [currentLevel, trials, earlyClicks, gameConfig]);

  // Initialize level with bandit-selected config
  const initializeLevel = useCallback(() => {
    const context = buildContext();
    const action = reactionBandit.selectAction(context);
    
    console.log('[ReactionGame] Bandit selected config:', action);
    
    setGameConfig(action);
    setCurrentTrial(0);
    setTrials([]);
    setEarlyClicks(0);
    setLevelComplete(false);
    reactionTimesRef.current = [];
    levelStartRef.current = Date.now();
    setBanditStats(reactionBandit.getStats());
  }, [buildContext]);

  useEffect(() => {
    initializeLevel();
  }, [currentLevel]);

  useEffect(() => {
    if (gameState === 'waiting' && gameStarted && !levelComplete) {
      startTrial();
    }
  }, [gameState, gameStarted, currentTrial, levelComplete]);

  const startTrial = () => {
    if (!gameConfig || currentTrial >= gameConfig.trialCount) {
      completeLevel();
      return;
    }

    setIsWaiting(true);
    setReactionTime(null);
    
    const delay = Math.random() * (gameConfig.maxDelay - gameConfig.minDelay) + gameConfig.minDelay;
    
    timeoutRef.current = setTimeout(() => {
      setGameState('active');
      setIsWaiting(false);
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'active') {
      const rt = Date.now() - startTimeRef.current;
      setReactionTime(rt);
      reactionTimesRef.current.push(rt);
      
      if (rt < bestReactionTimeRef.current) {
        bestReactionTimeRef.current = rt;
      }
      
      const trial: Trial = {
        id: currentTrial,
        delay: 0,
        reactionTime: rt,
        success: gameConfig ? rt <= gameConfig.targetTime * 2 : true,
      };
      
      setTrials(prev => [...prev, trial]);
      
      // Calculate score based on reaction time and target
      const targetTime = gameConfig?.targetTime || 450;
      const points = Math.max(0, Math.floor(100 - (rt / targetTime) * 50));
      setScore(prev => prev + points);
      
      setGameState('result');
      
      setTimeout(() => {
        setCurrentTrial(prev => prev + 1);
        setGameState('waiting');
      }, gameConfig?.feedbackDuration || 1500);
    } else if (isWaiting) {
      // Too early click
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setGameState('result');
      setReactionTime(-1);
      setEarlyClicks(prev => prev + 1);
      
      const trial: Trial = {
        id: currentTrial,
        delay: 0,
        reactionTime: -1,
        success: false,
      };
      
      setTrials(prev => [...prev, trial]);
      
      setTimeout(() => {
        setCurrentTrial(prev => prev + 1);
        setGameState('waiting');
      }, gameConfig?.feedbackDuration || 1500);
    }
  };

  const completeLevel = () => {
    if (!gameConfig) return;
    
    setLevelComplete(true);
    
    const validTrials = trials.filter(t => t.reactionTime && t.reactionTime > 0);
    const avgRT = validTrials.length > 0 
      ? validTrials.reduce((sum, t) => sum + (t.reactionTime || 0), 0) / validTrials.length
      : 500;
    setAvgReactionTime(avgRT);
    
    // Calculate metrics and update bandit
    const metrics = {
      completed: validTrials.length >= gameConfig.trialCount * 0.6,
      accuracy: trials.length > 0 ? validTrials.length / trials.length : 0,
      timeEfficiency: Math.max(0, 1 - avgRT / 600),
      engagement: Math.min(1, validTrials.filter(t => t.success).length / Math.max(1, validTrials.length)),
      frustration: earlyClicks > 2 ? Math.min(1, earlyClicks / gameConfig.trialCount) : 0,
      optimalMoves: gameConfig.trialCount,
      actualMoves: trials.length,
      avgReactionTime: avgRT,
      earlyClicks,
      totalTrials: trials.length,
    };
    
    const context = buildContext();
    const reward = reactionBandit.calculateReward(metrics);
    reactionBandit.updateModel(context, gameConfig, reward, metrics);
    
    console.log(`[ReactionGame] Level ${currentLevel} complete. Reward: ${reward.toFixed(1)}, Avg RT: ${avgRT.toFixed(0)}ms`);
    
    // Determine next level using bandit
    const optimalLevel = reactionBandit.getOptimalLevel(context);
    
    if (currentLevel < 25) {
      setTimeout(() => {
        setCurrentLevel(optimalLevel);
        setGameState('waiting');
      }, 3000);
    } else {
      setTimeout(() => {
        setGameState('complete');
        const finalScore = Math.min(100, Math.floor((score / (25 * 100)) * 100));
        onComplete(finalScore);
      }, 3000);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameState('waiting');
    sessionStartRef.current = Date.now();
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameStarted(false);
    setGameState('waiting');
    setAvgReactionTime(0);
    bestReactionTimeRef.current = Infinity;
    sessionStartRef.current = Date.now();
    initializeLevel();
  };

  if (gameState === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Lightning Fast!</h2>
            <p className="text-muted-foreground mb-4">
              AI-adapted reaction training complete!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Best Time</p>
                <p className="text-xl font-bold text-accent">
                  {bestReactionTimeRef.current === Infinity ? '--' : `${bestReactionTimeRef.current}ms`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>Skill Level: {(banditStats.skillLevel * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-4">
            <Button onClick={restartGame} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onExit} className="w-full btn-primary">
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (levelComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            <p className="text-muted-foreground">
              AI is adapting to your reaction patterns...
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className="text-xl font-bold text-primary">{Math.round(avgReactionTime)}ms</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-accent">{score}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>Exploration: {(banditStats.epsilon * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Reaction Speed - Level {currentLevel}</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/20 rounded text-xs">
                  <Brain className="h-3 w-3" />
                  <span>AI Adaptive</span>
                </div>
              </div>
              <p className="text-muted-foreground">Click as fast as you can when the circle turns green!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-2xl font-bold text-foreground">{currentLevel}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Trial</p>
            <p className="text-2xl font-bold text-foreground">{currentTrial + 1}/{gameConfig?.trialCount || 0}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Last Time</p>
            <p className="text-2xl font-bold text-foreground">
              {reactionTime === null ? '--' : reactionTime === -1 ? 'Too Early!' : `${reactionTime}ms`}
            </p>
          </div>
        </div>

        {/* Game Area */}
        <div className="glass-card p-8">
          <div className="text-center space-y-8">
            {!gameStarted ? (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Zap className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Reaction Speed Training</h2>
                  <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                    <p className="text-sm text-muted-foreground">⚡ Click when the circle turns green</p>
                    <p className="text-sm text-muted-foreground">⏱️ Faster reactions = higher scores</p>
                    <p className="text-sm text-muted-foreground">⚠️ Don't click too early!</p>
                    <p className="text-sm text-muted-foreground">🧠 AI adapts to your reaction speed</p>
                  </div>
                  {gameConfig && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-foreground">Level {currentLevel}</p>
                      <p className="text-xs text-muted-foreground">
                        {gameConfig.trialCount} trials • Target: {gameConfig.targetTime}ms
                      </p>
                      {gameConfig.showCountdown && (
                        <p className="text-xs text-accent mt-1">✨ Countdown hints enabled</p>
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={startGame} className="btn-primary">
                  <Zap className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {gameState === 'waiting' && (
                  <>
                    <h3 className="text-xl font-semibold text-foreground">Get Ready...</h3>
                    <div 
                      onClick={handleClick}
                      className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 flex items-center justify-center"
                    >
                      <span className="text-white font-bold text-lg">Wait...</span>
                    </div>
                    <p className="text-muted-foreground">
                      {isWaiting ? 'Wait for green...' : 'Click the circle when it turns green!'}
                    </p>
                  </>
                )}

                {gameState === 'active' && (
                  <>
                    <h3 className="text-xl font-semibold text-success">CLICK NOW!</h3>
                    <div 
                      onClick={handleClick}
                      className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 animate-pulse flex items-center justify-center"
                    >
                      <span className="text-white font-bold text-lg">CLICK!</span>
                    </div>
                    <p className="text-success font-semibold">Click as fast as you can!</p>
                  </>
                )}

                {gameState === 'result' && (
                  <>
                    <h3 className="text-xl font-semibold text-foreground">
                      {reactionTime === -1 ? 'Too Early!' : `${reactionTime}ms`}
                    </h3>
                    <div className={`w-48 h-48 mx-auto rounded-full shadow-lg flex items-center justify-center ${
                      reactionTime === -1 
                        ? 'bg-gradient-to-br from-red-500 to-red-600' 
                        : reactionTime && gameConfig && reactionTime <= gameConfig.targetTime
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {reactionTime === -1 ? '❌' : reactionTime && gameConfig && reactionTime <= gameConfig.targetTime ? '✅' : '⚡'}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {reactionTime === -1 
                        ? 'Wait for the green circle next time!' 
                        : reactionTime && gameConfig && reactionTime <= gameConfig.targetTime
                        ? 'Excellent reaction time!'
                        : 'Good! Try to be even faster next time.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactionSpeedGame;
