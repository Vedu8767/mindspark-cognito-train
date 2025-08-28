import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Navigation, MapPin, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const LEVELS = [
  { level: 1, gridSize: 6, pathLength: 4, trials: 8, timeLimit: 180 },
  { level: 2, gridSize: 7, pathLength: 5, trials: 10, timeLimit: 200 },
  { level: 3, gridSize: 8, pathLength: 6, trials: 12, timeLimit: 220 },
  { level: 4, gridSize: 9, pathLength: 7, trials: 14, timeLimit: 240 },
  { level: 5, gridSize: 10, pathLength: 8, trials: 16, timeLimit: 260 },
];

const SpatialNavigationGame = ({ onComplete, onExit }: SpatialNavigationGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
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

  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (currentLevel < LEVELS.length) {
      generateTrials();
    }
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const generatePath = (): Position[] => {
    const path: Position[] = [];
    const start = {
      x: Math.floor(level.gridSize / 2),
      y: Math.floor(level.gridSize / 2)
    };
    path.push(start);

    let current = { ...start };
    for (let i = 1; i < level.pathLength; i++) {
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];

      const validDirections = directions.filter(dir => {
        const next = { x: current.x + dir.x, y: current.y + dir.y };
        return next.x >= 0 && next.x < level.gridSize && 
               next.y >= 0 && next.y < level.gridSize &&
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

  const generateTrial = (id: number): Trial => {
    const path = generatePath();
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

  const generateTrials = () => {
    const newTrials = Array.from({ length: level.trials }, (_, i) => 
      generateTrial(i)
    );
    setTrials(newTrials);
    setCurrentTrial(0);
    setTimeLeft(level.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setGamePhase('study');
    if (newTrials.length > 0) {
      setPlayerPosition({ ...newTrials[0].playerPosition });
    }
    setMoveCount(0);
  };

  const startNavigation = () => {
    setGamePhase('navigate');
    setTrialStartTime(Date.now());
    setMoveCount(0);
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gamePhase !== 'navigate') return;

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

    // Check bounds
    if (newPosition.x >= 0 && newPosition.x < level.gridSize &&
        newPosition.y >= 0 && newPosition.y < level.gridSize) {
      setPlayerPosition(newPosition);
      setMoveCount(prev => prev + 1);

      // Check if reached target
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
      if (currentTrial + 1 >= level.trials) {
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
    
    // Calculate level completion bonus
    const accuracyBonus = Math.floor((correct / level.trials) * 50);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);
    
    setTimeout(() => {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
      } else {
        endGame();
      }
    }, 3000);
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
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  const renderGrid = () => {
    const trial = trials[currentTrial];
    if (!trial) return null;

    const cells = [];
    for (let y = 0; y < level.gridSize; y++) {
      for (let x = 0; x < level.gridSize; x++) {
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
          gridTemplateColumns: `repeat(${level.gridSize}, 1fr)`,
          maxWidth: `${level.gridSize * 40}px`
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
              You completed all {LEVELS.length} levels with {correct} successful navigations!
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Complete!</h2>
            <p className="text-muted-foreground">
              Excellent spatial memory! Moving to the next challenge.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{level.trials}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
          </div>
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
              <h1 className="text-2xl font-bold text-foreground">Spatial Navigation - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Study the path, then navigate to the target!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Trial</p>
            <p className="text-lg font-bold text-foreground">{currentTrial + 1}/{level.trials}</p>
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
                  <p className="text-sm text-muted-foreground">📈 {LEVELS.length} difficulty levels</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {level.trials} trials • {level.gridSize}×{level.gridSize} grid
                  </p>
                </div>
              </div>
              <Button onClick={startGame} className="btn-primary">
                <Navigation className="h-4 w-4 mr-2" />
                Start Training
              </Button>
            </div>
          ) : trials.length > 0 && currentTrial < trials.length ? (
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