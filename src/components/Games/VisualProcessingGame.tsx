import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VisualProcessingGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Shape {
  id: number;
  type: 'circle' | 'square' | 'triangle' | 'diamond';
  color: string;
  size: number;
  rotation: number;
}

interface Trial {
  id: number;
  targetShape: Shape;
  shapes: Shape[];
  userAnswer?: number;
  correct?: boolean;
  responseTime?: number;
}

const LEVELS = [
  { level: 1, trials: 8, gridSize: 3, distractors: 5, timeLimit: 45 },
  { level: 2, trials: 10, gridSize: 4, distractors: 8, timeLimit: 50 },
  { level: 3, trials: 12, gridSize: 4, distractors: 12, timeLimit: 55 },
  { level: 4, trials: 15, gridSize: 5, distractors: 16, timeLimit: 60 },
  { level: 5, trials: 18, gridSize: 5, distractors: 20, timeLimit: 65 },
];

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;

const VisualProcessingGame = ({ onComplete, onExit }: VisualProcessingGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [trialStartTime, setTrialStartTime] = useState(0);

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

  const generateShape = (): Shape => ({
    id: Math.random(),
    type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 30 + Math.random() * 20,
    rotation: Math.random() * 360
  });

  const generateTrial = (id: number): Trial => {
    const targetShape = generateShape();
    const shapes: Shape[] = [targetShape];
    
    // Add distractors
    for (let i = 0; i < level.distractors; i++) {
      let distractor = generateShape();
      // Ensure distractors are different
      while (
        distractor.type === targetShape.type &&
        distractor.color === targetShape.color
      ) {
        distractor = generateShape();
      }
      shapes.push(distractor);
    }

    // Shuffle shapes
    for (let i = shapes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
    }

    return { id, targetShape, shapes };
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
    setShowTarget(true);
  };

  const startTrial = () => {
    setShowTarget(false);
    setTrialStartTime(Date.now());
  };

  const handleShapeClick = (shapeIndex: number) => {
    if (showTarget) return;

    const responseTime = Date.now() - trialStartTime;
    const trial = trials[currentTrial];
    const clickedShape = trial.shapes[shapeIndex];
    const isCorrect = 
      clickedShape.type === trial.targetShape.type &&
      clickedShape.color === trial.targetShape.color;

    const updatedTrial = {
      ...trial,
      userAnswer: shapeIndex,
      correct: isCorrect,
      responseTime
    };

    setTrials(prev => {
      const updated = [...prev];
      updated[currentTrial] = updatedTrial;
      return updated;
    });

    if (isCorrect) {
      const timeBonus = Math.max(0, 15 - Math.floor(responseTime / 1000));
      const points = 10 + timeBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTrial + 1 >= level.trials) {
        completeLevel();
      } else {
        setCurrentTrial(prev => prev + 1);
        setShowTarget(true);
      }
    }, 1500);
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
    const finalScore = Math.min(100, Math.floor((score / 400) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeout(startTrial, 2000);
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  const renderShape = (shape: Shape, index: number, isTarget = false) => {
    const shapeClass = `cursor-pointer transition-all duration-200 hover:scale-110 ${
      isTarget ? 'animate-pulse' : ''
    }`;

    const shapeStyle = {
      width: shape.size,
      height: shape.size,
      backgroundColor: shape.color,
      transform: `rotate(${shape.rotation}deg)`,
    };

    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            className={`${shapeClass} rounded-full`}
            style={shapeStyle}
            onClick={() => !isTarget && handleShapeClick(index)}
          />
        );
      case 'square':
        return (
          <div
            key={shape.id}
            className={shapeClass}
            style={shapeStyle}
            onClick={() => !isTarget && handleShapeClick(index)}
          />
        );
      case 'triangle':
        return (
          <div
            key={shape.id}
            className={shapeClass}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid ${shape.color}`,
              transform: `rotate(${shape.rotation}deg)`,
            }}
            onClick={() => !isTarget && handleShapeClick(index)}
          />
        );
      case 'diamond':
        return (
          <div
            key={shape.id}
            className={shapeClass}
            style={{
              ...shapeStyle,
              transform: `rotate(45deg) rotate(${shape.rotation}deg)`,
            }}
            onClick={() => !isTarget && handleShapeClick(index)}
          />
        );
      default:
        return null;
    }
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Visual Expert!</h2>
            <p className="text-muted-foreground mb-4">
              You completed all {LEVELS.length} levels with {correct} correct identifications!
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
            <Eye className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Complete!</h2>
            <p className="text-muted-foreground">
              Excellent visual processing! Moving to the next challenge.
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
              <h1 className="text-2xl font-bold text-foreground">Visual Processing - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Find the shape that matches the target!</p>
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
            <p className="text-sm text-muted-foreground">Time</p>
            <div className="flex items-center justify-center space-x-1">
              <Clock className="h-4 w-4 text-foreground" />
              <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
            </div>
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
        </div>

        {/* Game Area */}
        <div className="space-y-6">
          {!gameStarted ? (
            <div className="glass-card p-8 text-center space-y-6">
              <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Eye className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Visual Processing</h2>
                <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">👁️ Study the target shape</p>
                  <p className="text-sm text-muted-foreground">🎯 Find matching shapes quickly</p>
                  <p className="text-sm text-muted-foreground">⚡ Speed bonus for fast responses</p>
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
                <Eye className="h-4 w-4 mr-2" />
                Start Training
              </Button>
            </div>
          ) : trials.length > 0 && currentTrial < trials.length ? (
            <>
              {/* Target Shape */}
              {showTarget && (
                <div className="glass-card p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Remember this shape:</h3>
                    <div className="flex justify-center">
                      {renderShape(trials[currentTrial].targetShape, 0, true)}
                    </div>
                    <Button onClick={startTrial} className="btn-primary">
                      Start Search
                    </Button>
                  </div>
                </div>
              )}

              {/* Search Grid */}
              {!showTarget && (
                <div className="glass-card p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Find the matching shape:</h3>
                    <div 
                      className="grid gap-4 mx-auto max-w-2xl"
                      style={{ gridTemplateColumns: `repeat(${level.gridSize}, 1fr)` }}
                    >
                      {trials[currentTrial].shapes.map((shape, index) => (
                        <div key={shape.id} className="flex justify-center items-center p-4">
                          {renderShape(shape, index)}
                        </div>
                      ))}
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

export default VisualProcessingGame;