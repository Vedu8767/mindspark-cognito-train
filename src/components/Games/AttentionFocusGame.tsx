import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Home, Trophy, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { attentionBandit, AttentionContext, AttentionAction } from '@/lib/bandit';

type TargetColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink';

interface GameTarget {
  id: number;
  x: number;
  y: number;
  type: 'target' | 'distractor';
  size: number;
  color: TargetColor;
}

const TARGET_COLOR: TargetColor = 'blue';
const DISTRACTOR_COLORS: TargetColor[] = ['red', 'orange', 'yellow', 'green', 'purple', 'pink'];

const getColorClasses = (color: TargetColor): string => {
  const colorMap: Record<TargetColor, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/50',
    red: 'from-red-500 to-red-600 shadow-red-500/50',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/50',
    yellow: 'from-yellow-400 to-yellow-500 shadow-yellow-500/50',
    green: 'from-green-500 to-green-600 shadow-green-500/50',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/50',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/50',
  };
  return colorMap[color];
};

interface AttentionFocusGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const AttentionFocusGame = ({ onComplete, onExit }: AttentionFocusGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  
  // Bandit-controlled game config
  const [gameConfig, setGameConfig] = useState<AttentionAction | null>(null);
  const [banditStats, setBanditStats] = useState(attentionBandit.getStats());
  const [nextLevelPrediction, setNextLevelPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState<string>("Let's see how you perform!");
  
  // Session tracking
  const sessionStartRef = useRef(Date.now());
  const levelStartRef = useRef(Date.now());
  const reactionTimesRef = useRef<number[]>([]);
  const lastSpawnTimeRef = useRef(0);
  const totalTargetsSpawnedRef = useRef(0);

  // Get time of day for context
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Build context for bandit
  const buildContext = useCallback((): AttentionContext => {
    const avgReactionTime = reactionTimesRef.current.length > 0
      ? reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
      : 400;
    
    const totalAttempts = hits + misses;
    const hitRate = totalAttempts > 0 ? hits / totalAttempts : 0.5;
    const missRate = totalAttempts > 0 ? misses / totalAttempts : 0;
    const accuracy = hitRate;
    
    // Determine user type based on recent performance
    let userType: 'precision_focused' | 'speed_focused' | 'balanced' = 'balanced';
    if (avgReactionTime < 300 && accuracy < 0.7) userType = 'speed_focused';
    else if (avgReactionTime > 500 && accuracy > 0.85) userType = 'precision_focused';
    
    // Calculate frustration and engagement
    const frustration = missRate > 0.4 ? Math.min(1, missRate * 1.5) : 0;
    const engagement = combo > 0 ? Math.min(1, 0.5 + combo * 0.1) : 0.5;
    
    return {
      currentLevel,
      recentAccuracy: accuracy,
      recentSpeed: avgReactionTime < 400 ? 0.8 : avgReactionTime < 600 ? 0.5 : 0.3,
      avgReactionTime,
      sessionLength: (Date.now() - sessionStartRef.current) / 1000,
      timeOfDay: getTimeOfDay(),
      previousDifficulty: gameConfig?.difficultyMultiplier || 1,
      streakCount: combo,
      userType,
      frustrationLevel: frustration,
      engagementLevel: engagement,
      successRate: hitRate,
      hitRate,
      missRate,
      comboStreak: combo,
    };
  }, [currentLevel, hits, misses, combo, gameConfig]);

  // Initialize level with bandit-selected config
  const initializeLevel = useCallback(() => {
    const context = buildContext();
    const action = attentionBandit.selectAction(context);
    
    console.log('[AttentionGame] Bandit selected config:', action);
    
    setGameConfig(action);
    setTargets([]);
    setTimeLeft(action.timeLimit);
    setGameStarted(false);
    setLevelComplete(false);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    reactionTimesRef.current = [];
    totalTargetsSpawnedRef.current = 0;
    levelStartRef.current = Date.now();
    setBanditStats(attentionBandit.getStats());
  }, [buildContext]);

  useEffect(() => {
    initializeLevel();
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const generateTarget = useCallback(() => {
    if (!gameStarted || gameComplete || levelComplete || !gameConfig) return;

    const isTarget = Math.random() < 0.4;
    const sizeVariation = gameConfig.targetSize + (Math.random() - 0.5) * 10;
    
    // Pick a random distractor color for variety
    const distractorColor = DISTRACTOR_COLORS[Math.floor(Math.random() * DISTRACTOR_COLORS.length)];
    
    const newTarget: GameTarget = {
      id: Date.now() + Math.random(),
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 300) + 150,
      type: isTarget ? 'target' : 'distractor',
      size: sizeVariation,
      color: isTarget ? TARGET_COLOR : distractorColor,
    };

    setTargets(prev => [...prev, newTarget]);
    lastSpawnTimeRef.current = Date.now();
    totalTargetsSpawnedRef.current++;

    // Remove target after duration
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== newTarget.id));
    }, gameConfig.targetDuration);
  }, [gameStarted, gameComplete, levelComplete, gameConfig]);

  useEffect(() => {
    if (gameStarted && !gameComplete && !levelComplete && gameConfig) {
      const interval = setInterval(generateTarget, gameConfig.spawnRate);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameComplete, levelComplete, generateTarget, gameConfig]);

  const handleTargetClick = (target: GameTarget) => {
    const reactionTime = Date.now() - lastSpawnTimeRef.current;
    reactionTimesRef.current.push(reactionTime);
    
    setTargets(prev => prev.filter(t => t.id !== target.id));
    
    if (target.type === 'target') {
      const points = 10 + combo * 2;
      setScore(prev => prev + points);
      setHits(prev => prev + 1);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(m => Math.max(m, newCombo));
        return newCombo;
      });
      
      if (gameConfig && hits + 1 >= gameConfig.targetCount) {
        completeLevel();
      }
    } else {
      setMisses(prev => prev + 1);
      setCombo(0);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const completeLevel = () => {
    if (!gameConfig) return;
    
    setLevelComplete(true);
    setTargets([]);
    
    // Calculate bonuses
    const timeBonus = Math.floor(timeLeft * 2);
    const totalAttempts = hits + misses;
    const accuracyBonus = totalAttempts > 0 ? Math.floor((hits / totalAttempts) * 50) : 0;
    const comboBonus = maxCombo * 5;
    setScore(prev => prev + timeBonus + accuracyBonus + comboBonus);
    
    // Calculate metrics and update bandit
    const avgReactionTime = reactionTimesRef.current.length > 0
      ? reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
      : 500;
    
    const metrics = {
      completed: hits >= Math.floor(gameConfig.targetCount * 0.7),
      accuracy: totalAttempts > 0 ? hits / totalAttempts : 0,
      timeEfficiency: gameConfig.timeLimit > 0 ? timeLeft / gameConfig.timeLimit : 0,
      engagement: Math.min(1, 0.5 + maxCombo * 0.1),
      frustration: misses > hits ? Math.min(1, misses / (hits + 1) * 0.5) : 0,
      optimalMoves: gameConfig.targetCount,
      actualMoves: totalAttempts,
      avgReactionTime,
      hitRate: totalAttempts > 0 ? hits / totalAttempts : 0,
      missRate: totalAttempts > 0 ? misses / totalAttempts : 0,
      comboMax: maxCombo,
    };
    
    const context = buildContext();
    const reward = attentionBandit.calculateReward(metrics);
    attentionBandit.updateModel(context, gameConfig, reward, metrics);
    
    console.log(`[AttentionGame] Level ${currentLevel} complete. Reward: ${reward.toFixed(1)}`);
    
    // Determine next level using bandit (no skipping)
    const optimalLevel = attentionBandit.getOptimalLevel(context);
    const prediction = attentionBandit.predictNextLevelDifficulty(context);
    const insight = attentionBandit.getPerformanceInsight(context);
    
    setNextLevelPrediction(prediction);
    setPerformanceInsight(insight);
    setBanditStats(attentionBandit.getStats());
    
    setTimeout(() => {
      if (currentLevel < 25) {
        setCurrentLevel(optimalLevel);
      } else {
        endGame();
      }
    }, 2500);
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 500) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    levelStartRef.current = Date.now();
    generateTarget();
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    sessionStartRef.current = Date.now();
    initializeLevel();
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Excellent Focus!</h2>
            <p className="text-muted-foreground mb-4">
              AI-adapted training complete with {hits} hits and {misses} misses!
            </p>
            <div className="bg-primary/10 p-4 rounded-lg mb-4">
              <p className="text-lg font-bold text-primary">Final Score: {score}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
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
    const getDifficultyColor = () => {
      if (nextLevelPrediction === 'harder') return 'text-orange-500';
      if (nextLevelPrediction === 'easier') return 'text-green-500';
      return 'text-blue-500';
    };
    
    const getDifficultyIcon = () => {
      if (nextLevelPrediction === 'harder') return '🔥';
      if (nextLevelPrediction === 'easier') return '💪';
      return '➡️';
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Target className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            
            {/* Performance Insight */}
            <div className="bg-primary/10 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-foreground">{performanceInsight}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Hits</p>
                <p className="text-xl font-bold text-success">{hits}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
            
            {/* Next Level Prediction */}
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Next Level Prediction</p>
              <p className={`text-lg font-bold ${getDifficultyColor()}`}>
                {getDifficultyIcon()} {nextLevelPrediction === 'harder' ? 'Challenge Incoming!' : nextLevelPrediction === 'easier' ? 'Easier Level' : 'Balanced Difficulty'}
              </p>
            </div>
            
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Skill: {(banditStats.skillLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Explore: {(banditStats.epsilon * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary relative overflow-hidden">
      {/* Game Header */}
      <div className="glass-card-strong p-4 m-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Attention Focus - Level {currentLevel}</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/20 rounded text-xs">
                <Brain className="h-3 w-3" />
                <span>AI Adaptive</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Tap only the blue targets, avoid red distractors!</p>
          </div>
          <Button onClick={onExit} variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-5 gap-2 px-4 relative z-10">
        <div className="glass-card p-2 text-center">
          <p className="text-xs text-muted-foreground">Time</p>
          <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="text-lg font-bold text-foreground">{score}</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-xs text-muted-foreground">Hits</p>
          <p className="text-lg font-bold text-success">{hits}/{gameConfig?.targetCount || 0}</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-xs text-muted-foreground">Misses</p>
          <p className="text-lg font-bold text-destructive">{misses}</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-xs text-muted-foreground">Combo</p>
          <p className="text-lg font-bold text-accent">{combo}</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 top-32">
        {targets.map((target) => (
          <button
            key={target.id}
            onClick={() => handleTargetClick(target)}
            className={`absolute rounded-full transition-all duration-200 hover:scale-110 focus-ring animate-pulse bg-gradient-to-br ${getColorClasses(target.color)} shadow-lg`}
            style={{
              left: target.x,
              top: target.y,
              width: target.size,
              height: target.size,
            }}
          />
        ))}
      </div>

      {/* Start Screen */}
      {!gameStarted && gameConfig && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
          <div className="glass-card-strong p-8 text-center space-y-6 max-w-md">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Attention Focus</h2>
              <div className="text-left space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">🔵 Tap ONLY blue targets (+10 points)</p>
                <p className="text-sm text-muted-foreground">🚫 Avoid ALL colored distractors (-5 points)</p>
                <p className="text-sm text-muted-foreground">⚡ Build combos for bonus points</p>
                <p className="text-sm text-muted-foreground">🧠 AI adapts difficulty to your skill</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-semibold text-foreground">Level {currentLevel}</p>
                <p className="text-xs text-muted-foreground">
                  Hit {gameConfig.targetCount} targets in {gameConfig.timeLimit} seconds
                </p>
                {gameConfig.showHints && (
                  <p className="text-xs text-accent mt-1">✨ Hints enabled</p>
                )}
              </div>
            </div>
            <Button onClick={startGame} className="w-full btn-primary">
              <Target className="h-4 w-4 mr-2" />
              Start Level {currentLevel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttentionFocusGame;
