import { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, Home, Trophy, Navigation, MapPin, Target, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { spatialBandit, type SpatialContext, type SpatialAction } from '@/lib/bandit/spatialBandit';

interface SpatialNavigationGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Trial {
  id: number;
  path: Position[];
  playerPosition: Position;
  targetPosition: Position;
  completed: boolean;
  correct: boolean;
  moves: number;
  timeSpent: number;
}

const SpatialNavigationGame = ({ onComplete, onExit }: SpatialNavigationGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gamePhase, setGamePhase] = useState<'study' | 'navigate'>('study');
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, y: 0 });
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [currentAction, setCurrentAction] = useState<SpatialAction | null>(null);

  // Build context for bandit
  const buildContext = useCallback((): SpatialContext => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    const completedTrials = trials.filter(t => t.completed);
    const recentAccuracy = completedTrials.length > 0
      ? completedTrials.filter(t => t.correct).length / completedTrials.length
      : 0.5;
    
    const avgMoves = completedTrials.length > 0
      ? completedTrials.reduce((sum, t) => sum + t.moves, 0) / completedTrials.length
      : 5;
    
    return {
      currentLevel,
      recentAccuracy,
      recentSpeed: timeLeft > 0 ? 1 - (timeLeft / (currentAction?.timeLimit || 180)) : 0.5,
      avgMoveCount: avgMoves,
      sessionLength: (Date.now() - sessionStart) / 1000,
      timeOfDay,
      previousDifficulty: currentAction?.difficultyMultiplier || 1,
      streakCount: correct,
      userType: avgMoves < 6 ? 'efficient_navigator' : avgMoves > 10 ? 'explorer' : 'balanced',
      frustrationLevel: recentAccuracy < 0.4 ? 0.7 : recentAccuracy < 0.6 ? 0.4 : 0.1,
      engagementLevel: Math.min(1, (Date.now() - sessionStart) / 600000),
      successRate: recentAccuracy,
      avgPathCompletionRate: recentAccuracy,
      spatialMemoryStrength: recentAccuracy * 0.8 + (avgMoves < 8 ? 0.2 : 0),
    };
  }, [currentLevel, trials, timeLeft, correct, sessionStart, currentAction]);

  // Get action from bandit
  const getAction = useCallback(() => {
    const context = buildContext();
    return spatialBandit.selectAction(context);
  }, [buildContext]);

  // Initialize level with bandit action
  useEffect(() => {
    if (gameStarted && !levelComplete && !gameComplete) {
      const action = getAction();
      setCurrentAction(action);
      generateTrials(action);
      setLevelStartTime(Date.now());
    }
  }, [currentLevel, gameStarted]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete && trials.length > 0) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete, trials.length]);

  const generatePath = (gridSize: number, pathLength: number): Position[] => {
    const path: Position[] = [];
    const start = {
      x: Math.floor(gridSize / 2),
      y: Math.floor(gridSize / 2)
    };
    path.push(start);

    let current = { ...start };
    for (let i = 1; i < pathLength; i++) {
      const directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
      ];

      const validDirections = directions.filter(dir => {
        const next = { x: current.x + dir.x, y: current.y + dir.y };
        return next.x >= 0 && next.x < gridSize && 
               next.y >= 0 && next.y < gridSize &&
               !path.some(pos => pos.x === next.x && pos.y === next.y);
      });

      if (validDirections.length > 0) {
        const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
        current = { x: current.x + randomDir.x, y: current.y + randomDir.y };
        path.push({ ...current });
      }
    }

    return path;
  };

  const generateTrial = (id: number, action: SpatialAction): Trial => {
    const path = generatePath(action.gridSize, action.pathLength);
    const startPosition = path[0];
    const targetPosition = path[path.length - 1];

    return {
      id,
      path,
      playerPosition: { ...startPosition },
      targetPosition,
      completed: false,
      correct: false,
      moves: 0,
      timeSpent: 0
    };
  };

  const generateTrials = (action: SpatialAction) => {
    const newTrials = Array.from({ length: action.trialCount }, (_, i) => 
      generateTrial(i, action)
    );
    setTrials(newTrials);
    setCurrentTrial(0);
    setTimeLeft(action.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setGamePhase('study');
    if (newTrials.length > 0) {
      setPlayerPosition({ ...newTrials[0].playerPosition });
    }
    setMoveCount(0);
    setTotalMoves(0);
  };

  const startNavigation = () => {
    setGamePhase('navigate');
    setTrialStartTime(Date.now());
    setMoveCount(0);
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gamePhase !== 'navigate' || !currentAction) return;

    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    const move = directions[direction];
    const newPosition = {
      x: playerPosition.x + move.x,
      y: playerPosition.y + move.y
    };

    if (newPosition.x >= 0 && newPosition.x < currentAction.gridSize &&
        newPosition.y >= 0 && newPosition.y < currentAction.gridSize) {
      setPlayerPosition(newPosition);
      setMoveCount(prev => prev + 1);
      setTotalMoves(prev => prev + 1);

      const trial = trials[currentTrial];
      if (newPosition.x === trial.targetPosition.x && 
          newPosition.y === trial.targetPosition.y) {
        completeTrial(true);
      }
    }
  };

  const completeTrial = (success: boolean) => {
    const timeSpent = Date.now() - trialStartTime;
    const trial = trials[currentTrial];
    
    const updatedTrial = {
      ...trial,
      completed: true,
      correct: success,
      moves: moveCount,
      timeSpent
    };

    setTrials(prev => {
      const updated = [...prev];
      updated[currentTrial] = updatedTrial;
      return updated;
    });

    if (success) {
      const timeBonus = Math.max(0, 30 - Math.floor(timeSpent / 1000));
      const moveBonus = Math.max(0, 20 - moveCount);
      const points = 20 + timeBonus + moveBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTrial + 1 >= (currentAction?.trialCount || 8)) {
        completeLevel();
      } else {
        const nextTrial = currentTrial + 1;
        setCurrentTrial(nextTrial);
        setGamePhase('study');
        setPlayerPosition({ ...trials[nextTrial].playerPosition });
        setMoveCount(0);
      }
    }, 2000);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    const completedTrials = trials.filter(t => t.completed);
    const accuracy = completedTrials.length > 0 
      ? completedTrials.filter(t => t.correct).length / completedTrials.length 
      : 0;
    const avgMoves = completedTrials.length > 0 
      ? completedTrials.reduce((sum, t) => sum + t.moves, 0) / completedTrials.length 
      : 10;
    const optimalMoves = (currentAction?.pathLength || 4) - 1;
    const moveEfficiency = avgMoves > 0 ? Math.min(1, optimalMoves / avgMoves) : 0.5;
    
    const accuracyBonus = Math.floor(accuracy * 50);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);

    // Update bandit
    if (currentAction) {
      const context = buildContext();
      const metrics = {
        completed: true,
        accuracy,
        timeEfficiency: timeLeft / (currentAction.timeLimit || 180),
        engagement: 0.8,
        frustration: accuracy < 0.5 ? 0.6 : 0.2,
        optimalMoves: optimalMoves * (currentAction.trialCount || 8),
        actualMoves: totalMoves,
        avgReactionTime: completedTrials.length > 0 
          ? completedTrials.reduce((sum, t) => sum + t.timeSpent, 0) / completedTrials.length 
          : 2000,
        pathCompletionRate: accuracy,
        moveEfficiency,
      };
      
      const reward = spatialBandit.calculateReward(metrics);
      spatialBandit.updateModel(context, currentAction, reward, metrics);
    }
  };

  const proceedToNextLevel = () => {
    const context = buildContext();
    const nextLevel = spatialBandit.getOptimalLevel(context);
    
    if (nextLevel > 25 || (currentLevel >= 25 && correct > (currentAction?.trialCount || 8) * 0.7)) {
      endGame();
    } else {
      setCurrentLevel(nextLevel);
      setLevelComplete(false);
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 600) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
    setLevelComplete(false);
    setTrials([]);
    setCurrentAction(null);
  };

  const banditStats = spatialBandit.getStats();
  const nextDifficulty = spatialBandit.predictNextLevelDifficulty(buildContext());
  const performanceInsight = spatialBandit.getPerformanceInsight(buildContext());

  const renderGrid = () => {
    const trial = trials[currentTrial];
    if (!trial || !currentAction) return null;

    const cells = [];
    for (let y = 0; y < currentAction.gridSize; y++) {
      for (let x = 0; x < currentAction.gridSize; x++) {
        const isPlayer = playerPosition.x === x && playerPosition.y === y;
        const isTarget = trial.targetPosition.x === x && trial.targetPosition.y === y && gamePhase === 'navigate';
        const isPath = gamePhase === 'study' && trial.path.some(pos => pos.x === x && pos.y === y);
        const isStart = trial.path[0].x === x && trial.path[0].y === y;
        const isEnd = trial.path[trial.path.length - 1].x === x && trial.path[trial.path.length - 1].y === y;

        let cellClass = "w-8 h-8 border border-border flex items-center justify-center text-xs";
        
        if (isPlayer) {
          cellClass += " bg-primary text-primary-foreground rounded-full";
        } else if (isTarget) {
          cellClass += " bg-destructive text-destructive-foreground animate-pulse";
        } else if (isPath && gamePhase === 'study') {
          if (isStart) {
            cellClass += " bg-success text-success-foreground";
          } else if (isEnd) {
            cellClass += " bg-accent text-accent-foreground";
          } else {
            cellClass += " bg-secondary text-secondary-foreground";
          }
        } else {
          cellClass += " bg-muted hover:bg-muted/80";
        }

        cells.push(
          <div key={`${x}-${y}`} className={cellClass}>
            {isPlayer && '👤'}
            {isTarget && '🎯'}
            {gamePhase === 'study' && isStart && '🏁'}
            {gamePhase === 'study' && isEnd && '🏆'}
          </div>
        );
      }
    }

    return (
      <div 
        className="grid gap-1 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${currentAction.gridSize}, 1fr)`,
          maxWidth: `${currentAction.gridSize * 40}px`
        }}
      >
        {cells}
      </div>
    );
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Navigation Expert!</h2>
            <p className="text-muted-foreground mb-4">
              You reached level {currentLevel} with {correct} successful navigations!
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-lg font-bold text-primary">Final Score: {score}</p>
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
            <Navigation className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            <p className="text-muted-foreground mb-2">{performanceInsight}</p>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Next level will be:</span>
              {nextDifficulty === 'harder' && (
                <span className="flex items-center text-destructive font-semibold">
                  <TrendingUp className="h-4 w-4 mr-1" /> Harder
                </span>
              )}
              {nextDifficulty === 'easier' && (
                <span className="flex items-center text-success font-semibold">
                  <TrendingDown className="h-4 w-4 mr-1" /> Easier
                </span>
              )}
              {nextDifficulty === 'same' && (
                <span className="flex items-center text-primary font-semibold">
                  <Minus className="h-4 w-4 mr-1" /> Similar
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{currentAction?.trialCount || 8}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
          </div>
          <Button onClick={proceedToNextLevel} className="btn-primary w-full">
            Continue to Level {spatialBandit.getOptimalLevel(buildContext())}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">Spatial Navigation - Level {currentLevel}</h1>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Adaptive
                </span>
              </div>
              <p className="text-muted-foreground">Study the path, then navigate to the target!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
          
          {gameStarted && (
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Exploration: {(banditStats.epsilon * 100).toFixed(0)}%</span>
              <span>Skill: {(banditStats.skillLevel * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Game Stats */}
        {gameStarted && currentAction && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Trial</p>
              <p className="text-lg font-bold text-foreground">{currentTrial + 1}/{currentAction.trialCount}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-lg font-bold text-foreground">{score}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="text-lg font-bold text-success">{correct}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Moves</p>
              <p className="text-lg font-bold text-accent">{moveCount}</p>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="space-y-6">
          {!gameStarted ? (
            <div className="glass-card p-8 text-center space-y-6">
              <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Navigation className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Spatial Navigation</h2>
                <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">🗺️ Study the highlighted path</p>
                  <p className="text-sm text-muted-foreground">🎯 Navigate to the target location</p>
                  <p className="text-sm text-muted-foreground">⚡ Fewer moves = higher score</p>
                  <p className="text-sm text-muted-foreground">🧠 AI adapts difficulty to your skill</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-foreground">Starting Level {currentLevel}</p>
                  <p className="text-xs text-muted-foreground">
                    Difficulty adjusts based on your performance
                  </p>
                </div>
              </div>
              <Button onClick={startGame} className="btn-primary">
                <Navigation className="h-4 w-4 mr-2" />
                Start Training
              </Button>
            </div>
          ) : trials.length > 0 && currentTrial < trials.length && currentAction ? (
            <>
              {/* Game Grid */}
              <div className="glass-card p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {gamePhase === 'study' ? 'Study the Path' : 'Navigate to Target'}
                  </h3>
                  {renderGrid()}
                  
                  {gamePhase === 'study' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Memorize the path from 🏁 to 🏆
                      </p>
                      <Button onClick={startNavigation} className="btn-primary">
                        Start Navigation
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              {gamePhase === 'navigate' && (
                <div className="glass-card p-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Use the buttons to move 👤 to the target 🎯
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                      <div></div>
                      <Button onClick={() => movePlayer('up')} variant="outline" className="h-12">
                        ↑
                      </Button>
                      <div></div>
                      <Button onClick={() => movePlayer('left')} variant="outline" className="h-12">
                        ←
                      </Button>
                      <Button onClick={() => movePlayer('down')} variant="outline" className="h-12">
                        ↓
                      </Button>
                      <Button onClick={() => movePlayer('right')} variant="outline" className="h-12">
                        →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SpatialNavigationGame;
