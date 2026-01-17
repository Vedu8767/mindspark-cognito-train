import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Eye, Clock, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { visualProcessingBandit, type VisualContext, type VisualAction } from '@/lib/bandit/visualProcessingBandit';

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

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;

const VisualProcessingGame = ({ onComplete, onExit }: VisualProcessingGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
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
  const [currentAction, setCurrentAction] = useState<VisualAction | null>(null);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [levelStartTime, setLevelStartTime] = useState(0);

  const getContext = useCallback((): VisualContext => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 2000;
    
    return {
      currentLevel,
      recentAccuracy: trials.length > 0 ? correct / Math.max(1, currentTrial) : 0.5,
      recentSpeed: Math.min(1, 2500 / Math.max(500, avgResponseTime)),
      sessionLength: Math.floor((Date.now() - levelStartTime) / 60000),
      timeOfDay,
      streakCount: 0,
      avgResponseTime,
      shapeRecognitionSpeed: avgResponseTime,
      colorAccuracy: correct / Math.max(1, currentTrial),
      distractorResistance: 0.5,
    };
  }, [currentLevel, correct, currentTrial, responseTimes, trials.length, levelStartTime]);

  useEffect(() => {
    if (gameStarted && !levelComplete && !gameComplete) {
      const context = getContext();
      const action = visualProcessingBandit.selectAction(context);
      setCurrentAction(action);
      generateTrials(action);
    }
  }, [currentLevel, gameStarted]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete && currentAction) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const generateShape = (colorVariety: number = 6): Shape => ({
    id: Math.random(),
    type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * Math.min(colorVariety, COLORS.length))],
    size: 30 + Math.random() * 20,
    rotation: Math.random() * 360
  });

  const generateTrial = (id: number, action: VisualAction): Trial => {
    const targetShape = generateShape(action.colorVariety);
    const shapes: Shape[] = [targetShape];
    
    for (let i = 0; i < action.distractors; i++) {
      let distractor = generateShape(action.colorVariety);
      while (
        distractor.type === targetShape.type &&
        distractor.color === targetShape.color
      ) {
        distractor = generateShape(action.colorVariety);
      }
      shapes.push(distractor);
    }

    for (let i = shapes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
    }

    return { id, targetShape, shapes };
  };

  const generateTrials = (action: VisualAction) => {
    const newTrials = Array.from({ length: action.trials }, (_, i) => 
      generateTrial(i, action)
    );
    setTrials(newTrials);
    setCurrentTrial(0);
    setTimeLeft(action.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setShowTarget(true);
    setResponseTimes([]);
    setLevelStartTime(Date.now());
  };

  const startTrial = () => {
    setShowTarget(false);
    setTrialStartTime(Date.now());
  };

  const handleShapeClick = (shapeIndex: number) => {
    if (showTarget || !currentAction) return;

    const responseTime = Date.now() - trialStartTime;
    setResponseTimes(prev => [...prev, responseTime]);
    
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
      const levelBonus = Math.floor(currentLevel * 0.5);
      const points = 10 + timeBonus + levelBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTrial + 1 >= currentAction.trials) {
        completeLevel();
      } else {
        setCurrentTrial(prev => prev + 1);
        setShowTarget(true);
      }
    }, 1500);
  };

  const completeLevel = () => {
    if (!currentAction) return;
    
    setLevelComplete(true);
    
    const context = getContext();
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 2000;
    
    visualProcessingBandit.updateModel(context, currentAction, {
      accuracy: correct / currentAction.trials,
      avgResponseTime,
      completed: true,
      timeRemaining: timeLeft,
    });
    
    const accuracyBonus = Math.floor((correct / currentAction.trials) * 50);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);
  };

  const proceedToNextLevel = () => {
    const context = getContext();
    const nextLevel = visualProcessingBandit.getOptimalLevel(context);
    
    if (nextLevel > currentLevel && currentLevel >= 25) {
      endGame();
    } else {
      setCurrentLevel(nextLevel);
      setLevelComplete(false);
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 500) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setLevelStartTime(Date.now());
    setTimeout(startTrial, 2000);
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
    setCurrentAction(null);
    setResponseTimes([]);
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

  const banditStats = visualProcessingBandit.getStats();
  const context = getContext();
  const nextDifficulty = visualProcessingBandit.predictNextLevelDifficulty(context);
  const insight = visualProcessingBandit.getPerformanceInsight(context);

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
              You reached level {currentLevel} with {correct} correct identifications!
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

  if (levelComplete && currentAction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Eye className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">{insight}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{currentAction.trials}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Next Level Prediction</p>
              <div className="flex items-center justify-center gap-2">
                {nextDifficulty === 'harder' && (
                  <>
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">Moving Up!</span>
                  </>
                )}
                {nextDifficulty === 'easier' && (
                  <>
                    <TrendingDown className="h-5 w-5 text-warning" />
                    <span className="text-warning font-medium">Adjusting Down</span>
                  </>
                )}
                {nextDifficulty === 'same' && (
                  <>
                    <Minus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Same Level</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button onClick={proceedToNextLevel} className="w-full btn-primary">
            Continue
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
                <h1 className="text-2xl font-bold text-foreground">Visual Processing - Level {currentLevel}</h1>
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Adaptive
                </span>
              </div>
              <p className="text-muted-foreground">Find the shape that matches the target!</p>
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
            <div className="flex items-center justify-center space-x-1">
              <Clock className="h-4 w-4 text-foreground" />
              <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Trial</p>
            <p className="text-lg font-bold text-foreground">{currentTrial + 1}/{currentAction?.trials || 0}</p>
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
            <p className="text-sm text-muted-foreground">AI Explore</p>
            <p className="text-lg font-bold text-primary">{Math.round(banditStats.epsilon * 100)}%</p>
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
                  <p className="text-sm text-muted-foreground">🤖 AI adapts difficulty to your skill</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-foreground">Starting Level {currentLevel}</p>
                  <p className="text-xs text-muted-foreground">
                    AI Skill: {Math.round(banditStats.skillLevel * 100)}%
                  </p>
                </div>
              </div>
              <Button onClick={startGame} className="btn-primary">
                <Eye className="h-4 w-4 mr-2" />
                Start Training
              </Button>
            </div>
          ) : trials.length > 0 && currentTrial < trials.length && currentAction ? (
            <>
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

              {!showTarget && (
                <div className="glass-card p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Find the matching shape:</h3>
                    <div 
                      className="grid gap-4 mx-auto max-w-2xl"
                      style={{ gridTemplateColumns: `repeat(${currentAction.gridSize}, 1fr)` }}
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
