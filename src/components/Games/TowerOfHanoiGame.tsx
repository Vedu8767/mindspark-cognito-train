import { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, Home, Trophy, Puzzle, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  towerOfHanoiBandit, 
  HanoiContext, 
  HanoiAction 
} from '@/lib/bandit/towerOfHanoiBandit';

interface TowerOfHanoiGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const TowerOfHanoiGame = ({ onComplete, onExit }: TowerOfHanoiGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [towers, setTowers] = useState<number[][]>([[], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Bandit state
  const [currentConfig, setCurrentConfig] = useState<HanoiAction | null>(null);
  const [recentAccuracy, setRecentAccuracy] = useState(0.7);
  const [recentSpeed, setRecentSpeed] = useState(0.7);
  const [streakCount, setStreakCount] = useState(0);
  const [frustrationLevel, setFrustrationLevel] = useState(0);
  const [avgMoveEfficiency, setAvgMoveEfficiency] = useState(0.7);
  const [nextDifficultyPrediction, setNextDifficultyPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState('');

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getUserType = (): 'speed_focused' | 'accuracy_focused' | 'balanced' => {
    if (recentSpeed > recentAccuracy + 0.15) return 'speed_focused';
    if (recentAccuracy > recentSpeed + 0.15) return 'accuracy_focused';
    return 'balanced';
  };

  const getContext = useCallback((): HanoiContext => {
    return {
      currentLevel,
      recentAccuracy,
      recentSpeed,
      sessionLength: Math.floor((Date.now() - startTime) / 60000),
      timeOfDay: getTimeOfDay(),
      previousDifficulty: currentConfig?.difficultyMultiplier || 1.0,
      streakCount,
      userType: getUserType(),
      avgMoveEfficiency,
      frustrationLevel,
      engagementLevel: Math.max(0, 1 - frustrationLevel),
      preferredDiskCount: currentConfig?.diskCount || 3,
      successRate: recentAccuracy,
      planningAbility: avgMoveEfficiency
    };
  }, [currentLevel, recentAccuracy, recentSpeed, startTime, currentConfig, streakCount, avgMoveEfficiency, frustrationLevel]);

  const minMoves = useMemo(() => {
    return currentConfig ? Math.pow(2, currentConfig.diskCount) - 1 : 7;
  }, [currentConfig]);

  const initializeLevel = useCallback(() => {
    const context = getContext();
    const config = towerOfHanoiBandit.selectAction(context);
    setCurrentConfig(config);
    
    const initialTower = Array.from({ length: config.diskCount }, (_, i) => config.diskCount - i);
    setTowers([initialTower, [], []]);
    setMoves(0);
    setSelectedTower(null);
    setTimeLeft(config.timeLimit);
    setLevelComplete(false);
    setStartTime(Date.now());
  }, [getContext]);

  useEffect(() => {
    if (gameStarted && !gameComplete) {
      initializeLevel();
    }
  }, [currentLevel, gameStarted]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !levelComplete && !gameComplete) {
      handleLevelComplete(false);
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const handleTowerClick = (towerIndex: number) => {
    if (levelComplete || gameComplete) return;
    
    if (selectedTower === null) {
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else {
      if (selectedTower === towerIndex) {
        setSelectedTower(null);
      } else {
        moveDisk(selectedTower, towerIndex);
        setSelectedTower(null);
      }
    }
  };

  const moveDisk = (fromTower: number, toTower: number) => {
    const newTowers = towers.map(tower => [...tower]);
    const disk = newTowers[fromTower].pop();
    
    if (disk && (newTowers[toTower].length === 0 || disk < newTowers[toTower][newTowers[toTower].length - 1])) {
      newTowers[toTower].push(disk);
      setTowers(newTowers);
      setMoves(prev => prev + 1);
      
      // Check win condition
      if (currentConfig && newTowers[2].length === currentConfig.diskCount) {
        setTimeout(() => handleLevelComplete(true), 500);
      }
    } else {
      // Invalid move - increase frustration
      setFrustrationLevel(prev => Math.min(1, prev + 0.05));
    }
  };

  const handleLevelComplete = (completed: boolean) => {
    if (!currentConfig) return;
    
    setLevelComplete(true);
    
    const timeUsed = currentConfig.timeLimit - timeLeft;
    const moveEfficiency = completed ? Math.min(1, minMoves / Math.max(moves, 1)) : 0;
    const timeEfficiency = completed ? timeLeft / currentConfig.timeLimit : 0;
    
    const metrics = {
      completed,
      accuracy: completed ? 1 : 0,
      timeEfficiency,
      moveEfficiency,
      optimalMoves: minMoves,
      actualMoves: moves,
      timeUsed,
      timeLimit: currentConfig.timeLimit
    };
    
    const reward = towerOfHanoiBandit.calculateReward(metrics);
    const context = getContext();
    
    towerOfHanoiBandit.updateModel(context, currentConfig, reward, metrics);
    
    // Update tracking
    setRecentAccuracy(prev => prev * 0.7 + (completed ? 1 : 0) * 0.3);
    setRecentSpeed(prev => prev * 0.7 + timeEfficiency * 0.3);
    setAvgMoveEfficiency(prev => prev * 0.7 + moveEfficiency * 0.3);
    
    if (completed) {
      setStreakCount(prev => prev + 1);
      setFrustrationLevel(prev => Math.max(0, prev - 0.1));
    } else {
      setStreakCount(0);
      setFrustrationLevel(prev => Math.min(1, prev + 0.15));
    }
    
    // Calculate score
    const efficiencyBonus = Math.floor(moveEfficiency * 100);
    const timeBonus = Math.floor(timeLeft * 2);
    const levelPoints = currentConfig.diskCount * 20;
    const totalPoints = completed ? levelPoints + efficiencyBonus + timeBonus : 10;
    
    setScore(prev => prev + totalPoints);
    
    // Predict next difficulty
    const updatedContext = { ...context, recentAccuracy: recentAccuracy * 0.7 + (completed ? 1 : 0) * 0.3 };
    const prediction = towerOfHanoiBandit.predictNextDifficulty(updatedContext);
    const insight = towerOfHanoiBandit.getPerformanceInsight(updatedContext);
    setNextDifficultyPrediction(prediction);
    setPerformanceInsight(insight);
  };

  const advanceToNextLevel = () => {
    const context = getContext();
    const optimalLevel = towerOfHanoiBandit.getOptimalLevel(context);
    
    if (optimalLevel >= 25 || currentLevel >= 25) {
      setGameComplete(true);
      const finalScore = Math.min(100, Math.floor((score / 1000) * 100));
      onComplete(finalScore);
    } else {
      setCurrentLevel(optimalLevel);
      setLevelComplete(false);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
    setLevelComplete(false);
    setRecentAccuracy(0.7);
    setRecentSpeed(0.7);
    setStreakCount(0);
    setFrustrationLevel(0);
    setAvgMoveEfficiency(0.7);
  };

  const renderDisk = (size: number) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'
    ];
    const maxDiskCount = currentConfig?.diskCount || 7;
    const width = `${(size / maxDiskCount) * 80 + 20}%`;
    
    return (
      <div
        className={`h-8 ${colors[(size - 1) % colors.length]} rounded-lg mx-auto mb-1 flex items-center justify-center text-white font-bold shadow-lg transition-all`}
        style={{ width }}
      >
        {size}
      </div>
    );
  };

  const getDifficultyIcon = () => {
    switch (nextDifficultyPrediction) {
      case 'harder': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'easier': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-blue-500" />;
    }
  };

  const banditStats = towerOfHanoiBandit.getStats();

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <Trophy className="h-16 w-16 text-success mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Master!</h2>
            <p className="text-muted-foreground mb-4">Final Score: {score}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Skill Level: {banditStats.skillLevel}</p>
              <p>Levels Completed: {currentLevel}</p>
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
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-12 w-12 text-success" />
            <Badge variant="outline" className="bg-primary/10">
              <Brain className="h-3 w-3 mr-1" />
              AI Adaptive
            </Badge>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level Complete!</h2>
            <p className="text-muted-foreground mb-4">Score: {score}</p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-center gap-2">
                {getDifficultyIcon()}
                <span className="text-sm">
                  Next level will be <span className="font-semibold">{nextDifficultyPrediction}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground italic">{performanceInsight}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-muted-foreground">Moves</p>
              <p className="font-bold">{moves} / {minMoves} optimal</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-muted-foreground">Efficiency</p>
              <p className="font-bold">{Math.round((minMoves / Math.max(moves, 1)) * 100)}%</p>
            </div>
          </div>
          <Button onClick={advanceToNextLevel} className="w-full btn-primary">
            Continue to Level {towerOfHanoiBandit.getOptimalLevel(getContext())}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tower of Hanoi - Level {currentLevel}</h1>
                <p className="text-muted-foreground">Move all disks to the rightmost tower!</p>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                <Brain className="h-3 w-3 mr-1" />
                AI Adaptive
              </Badge>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        {!gameStarted ? (
          <div className="glass-card p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Puzzle className="h-24 w-24 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Tower of Hanoi</h2>
              <p className="text-muted-foreground mb-6">
                Move all disks to the right tower. Only smaller disks can go on top of larger ones.
              </p>
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">AI-Powered Adaptive Difficulty</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The game adjusts to your planning abilities across 25 levels
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground">Exploration Rate</p>
                  <p className="font-bold">{(banditStats.epsilon * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground">Skill Level</p>
                  <p className="font-bold">{banditStats.skillLevel}</p>
                </div>
              </div>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Puzzle className="h-4 w-4 mr-2" />
              Start Puzzle
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className={`text-lg font-bold ${timeLeft < 30 ? 'text-destructive' : ''}`}>{timeLeft}s</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Moves</p>
                <p className="text-lg font-bold">{moves}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Optimal</p>
                <p className="text-lg font-bold">{minMoves}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-bold">{score}</p>
              </div>
            </div>

            {currentConfig && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Disks: <span className="font-semibold text-foreground">{currentConfig.diskCount}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Streak: <span className="font-semibold text-success">{streakCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Difficulty: <span className="font-semibold">{currentConfig.difficultyMultiplier.toFixed(2)}x</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card p-8">
              <div className="grid grid-cols-3 gap-8">
                {towers.map((tower, towerIndex) => (
                  <div
                    key={towerIndex}
                    onClick={() => handleTowerClick(towerIndex)}
                    className={`cursor-pointer p-4 min-h-64 border-2 border-dashed rounded-lg transition-all ${
                      selectedTower === towerIndex 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col-reverse justify-start items-center h-full">
                      <div className="w-full h-4 bg-border rounded mb-2"></div>
                      {tower.map((disk, diskIndex) => (
                        <div key={diskIndex} className="w-full">
                          {renderDisk(disk)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 text-center text-sm text-muted-foreground">
              <p>Click a tower to select a disk, then click another tower to move it.</p>
              <p className="mt-1">Smaller disks can only be placed on larger disks.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerOfHanoiGame;
