import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Home, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const LEVELS = [
  { level: 1, trials: 5, minDelay: 1000, maxDelay: 3000, targetTime: 500 },
  { level: 2, trials: 8, minDelay: 800, maxDelay: 2500, targetTime: 450 },
  { level: 3, trials: 10, minDelay: 600, maxDelay: 2000, targetTime: 400 },
  { level: 4, trials: 12, minDelay: 500, maxDelay: 1800, targetTime: 350 },
  { level: 5, trials: 15, minDelay: 400, maxDelay: 1500, targetTime: 300 },
];

const ReactionSpeedGame = ({ onComplete, onExit }: ReactionSpeedGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'active' | 'result' | 'complete'>('waiting');
  const [isWaiting, setIsWaiting] = useState(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [avgReactionTime, setAvgReactionTime] = useState(0);
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (gameState === 'waiting' && gameStarted) {
      startTrial();
    }
  }, [gameState, gameStarted, currentTrial]);

  const startTrial = () => {
    if (currentTrial >= level.trials) {
      completeLevel();
      return;
    }

    setIsWaiting(true);
    setReactionTime(null);
    
    const delay = Math.random() * (level.maxDelay - level.minDelay) + level.minDelay;
    
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
      
      const trial: Trial = {
        id: currentTrial,
        delay: 0,
        reactionTime: rt,
        success: rt <= level.targetTime * 2, // Generous success criteria
      };
      
      setTrials(prev => [...prev, trial]);
      
      // Calculate score based on reaction time
      const points = Math.max(0, Math.floor(100 - (rt / level.targetTime) * 50));
      setScore(prev => prev + points);
      
      setGameState('result');
      
      setTimeout(() => {
        setCurrentTrial(prev => prev + 1);
        setGameState('waiting');
      }, 1500);
    } else if (isWaiting) {
      // Too early click
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setGameState('result');
      setReactionTime(-1); // Indicates too early
      
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
      }, 1500);
    }
  };

  const completeLevel = () => {
    const validTrials = trials.filter(t => t.reactionTime && t.reactionTime > 0);
    const avgRT = validTrials.reduce((sum, t) => sum + (t.reactionTime || 0), 0) / validTrials.length;
    setAvgReactionTime(avgRT);
    
    if (currentLevel < LEVELS.length - 1) {
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setCurrentTrial(0);
        setTrials([]);
        setGameState('waiting');
      }, 3000);
    } else {
      setTimeout(() => {
        setGameState('complete');
        const finalScore = Math.min(100, Math.floor((score / (LEVELS.length * 100)) * 100));
        onComplete(finalScore);
      }, 3000);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameState('waiting');
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setCurrentTrial(0);
    setTrials([]);
    setScore(0);
    setGameStarted(false);
    setGameState('waiting');
    setAvgReactionTime(0);
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
              You completed all {LEVELS.length} levels of reaction speed training!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-xl font-bold text-accent">{Math.round(avgReactionTime)}ms</p>
              </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reaction Speed - Level {currentLevel + 1}</h1>
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
            <p className="text-2xl font-bold text-foreground">{currentLevel + 1}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Trial</p>
            <p className="text-2xl font-bold text-foreground">{currentTrial + 1}/{level.trials}</p>
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
                    <p className="text-sm text-muted-foreground">📈 {LEVELS.length} difficulty levels</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.trials} trials • Target: {level.targetTime}ms
                    </p>
                  </div>
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
                        : reactionTime && reactionTime <= level.targetTime
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {reactionTime === -1 ? '❌' : reactionTime && reactionTime <= level.targetTime ? '✅' : '⚡'}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {reactionTime === -1 
                        ? 'Wait for the green circle next time!' 
                        : reactionTime && reactionTime <= level.targetTime
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