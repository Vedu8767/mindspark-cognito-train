import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Target {
  id: number;
  x: number;
  y: number;
  type: 'target' | 'distractor';
  size: number;
}

interface AttentionFocusGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const LEVELS = [
  { level: 1, targets: 3, distractors: 2, timeLimit: 30, spawnRate: 2000 },
  { level: 2, targets: 4, distractors: 4, timeLimit: 35, spawnRate: 1800 },
  { level: 3, targets: 5, distractors: 6, timeLimit: 40, spawnRate: 1600 },
  { level: 4, targets: 6, distractors: 8, timeLimit: 45, spawnRate: 1400 },
  { level: 5, targets: 8, distractors: 12, timeLimit: 50, spawnRate: 1200 },
];

const AttentionFocusGame = ({ onComplete, onExit }: AttentionFocusGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [combo, setCombo] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);

  const level = LEVELS[currentLevel];

  useEffect(() => {
    resetLevel();
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const resetLevel = () => {
    setTargets([]);
    setTimeLeft(level.timeLimit);
    setGameStarted(false);
    setLevelComplete(false);
    setHits(0);
    setMisses(0);
    setCombo(0);
  };

  const generateTarget = useCallback(() => {
    if (!gameStarted || gameComplete || levelComplete) return;

    const isTarget = Math.random() < 0.4; // 40% chance for target
    const size = 40 + Math.random() * 20;
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 300) + 150,
      type: isTarget ? 'target' : 'distractor',
      size,
    };

    setTargets(prev => [...prev, newTarget]);

    // Remove target after 3 seconds
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== newTarget.id));
    }, 3000);
  }, [gameStarted, gameComplete, levelComplete]);

  useEffect(() => {
    if (gameStarted && !gameComplete && !levelComplete) {
      const interval = setInterval(generateTarget, level.spawnRate);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameComplete, levelComplete, generateTarget, level.spawnRate]);

  const handleTargetClick = (target: Target) => {
    setTargets(prev => prev.filter(t => t.id !== target.id));
    
    if (target.type === 'target') {
      const points = 10 + combo * 2;
      setScore(prev => prev + points);
      setHits(prev => prev + 1);
      setCombo(prev => prev + 1);
      
      if (hits + 1 >= level.targets) {
        completeLevel();
      }
    } else {
      setMisses(prev => prev + 1);
      setCombo(0);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const completeLevel = () => {
    setLevelComplete(true);
    setTargets([]);
    
    // Level completion bonus
    const timeBonus = Math.floor(timeLeft * 2);
    const accuracyBonus = Math.floor((hits / Math.max(hits + misses, 1)) * 50);
    const comboBonus = combo * 5;
    setScore(prev => prev + timeBonus + accuracyBonus + comboBonus);
    
    setTimeout(() => {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
      } else {
        endGame();
      }
    }, 2000);
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 500) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    generateTarget();
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    resetLevel();
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
              You completed all {LEVELS.length} levels with {hits} hits and {misses} misses!
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
            <Target className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Complete!</h2>
            <p className="text-muted-foreground">
              Great focus! Moving to the next challenge.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Hits</p>
                <p className="text-xl font-bold text-success">{hits}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary relative overflow-hidden">
      {/* Game Header */}
      <div className="glass-card-strong p-4 m-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Attention Focus - Level {currentLevel + 1}</h1>
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
          <p className="text-lg font-bold text-success">{hits}/{level.targets}</p>
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
            className={`absolute rounded-full transition-all duration-200 hover:scale-110 focus-ring animate-pulse ${
              target.type === 'target'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/50'
                : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50'
            } shadow-lg`}
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
      {!gameStarted && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
          <div className="glass-card-strong p-8 text-center space-y-6 max-w-md">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Attention Focus</h2>
              <div className="text-left space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">🎯 Tap blue targets (+10 points)</p>
                <p className="text-sm text-muted-foreground">❌ Avoid red distractors (-5 points)</p>
                <p className="text-sm text-muted-foreground">⚡ Build combos for bonus points</p>
                <p className="text-sm text-muted-foreground">📈 {LEVELS.length} challenging levels</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                <p className="text-xs text-muted-foreground">
                  Hit {level.targets} targets in {level.timeLimit} seconds
                </p>
              </div>
            </div>
            <Button onClick={startGame} className="w-full btn-primary">
              <Target className="h-4 w-4 mr-2" />
              Start Level {currentLevel + 1}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttentionFocusGame;