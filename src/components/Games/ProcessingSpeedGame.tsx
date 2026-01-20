import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Zap, Clock, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { processingSpeedBandit, type ProcessingContext, type ProcessingAction } from '@/lib/bandit/processingSpeedBandit';

interface ProcessingSpeedGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Symbol {
  id: number;
  symbol: string;
  code: string;
  position: number;
}

interface Trial {
  id: number;
  symbols: Symbol[];
  userAnswers: string[];
  correctAnswers: string[];
  completed: boolean;
  timeSpent: number;
  accuracy: number;
}

const SYMBOLS = ['★', '●', '■', '▲', '♦', '♠', '♥', '♣', '◆', '◇', '▼', '►'];
const CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'];

const ProcessingSpeedGame = ({ onComplete, onExit }: ProcessingSpeedGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [symbolMapping, setSymbolMapping] = useState<{[key: string]: string}>({});
  const [currentInputs, setCurrentInputs] = useState<string[]>([]);
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [currentAction, setCurrentAction] = useState<ProcessingAction | null>(null);

  // Build context for bandit
  const buildContext = useCallback((): ProcessingContext => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    const completedTrials = trials.filter(t => t.completed);
    const recentAccuracy = completedTrials.length > 0
      ? completedTrials.reduce((sum, t) => sum + t.accuracy, 0) / completedTrials.length
      : 0.5;
    
    const avgResponseTime = completedTrials.length > 0
      ? completedTrials.reduce((sum, t) => sum + t.timeSpent, 0) / completedTrials.length
      : 3000;
    
    return {
      currentLevel,
      recentAccuracy,
      recentSpeed: timeLeft > 0 ? 1 - (timeLeft / (currentAction?.timeLimit || 90)) : 0.5,
      avgResponseTime,
      sessionLength: (Date.now() - sessionStart) / 1000,
      timeOfDay,
      previousDifficulty: currentAction?.difficultyMultiplier || 1,
      streakCount: totalCorrect,
      userType: avgResponseTime < 2000 ? 'fast_processor' : recentAccuracy > 0.8 ? 'accurate_processor' : 'balanced',
      frustrationLevel: recentAccuracy < 0.4 ? 0.7 : recentAccuracy < 0.6 ? 0.4 : 0.1,
      engagementLevel: Math.min(1, (Date.now() - sessionStart) / 600000),
      successRate: recentAccuracy,
      symbolRecognitionSpeed: avgResponseTime > 0 ? Math.min(1, 2000 / avgResponseTime) : 0.5,
      codingAccuracy: recentAccuracy,
    };
  }, [currentLevel, trials, timeLeft, totalCorrect, sessionStart, currentAction]);

  // Get action from bandit
  const getAction = useCallback(() => {
    const context = buildContext();
    return processingSpeedBandit.selectAction(context);
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

  const generateSymbolMapping = (action: ProcessingAction) => {
    const mapping: {[key: string]: string} = {};
    const selectedSymbols = SYMBOLS.slice(0, action.symbolCount);
    const selectedCodes = CODES.slice(0, action.symbolCount);
    
    selectedSymbols.forEach((symbol, index) => {
      mapping[symbol] = selectedCodes[index];
    });
    
    setSymbolMapping(mapping);
    return mapping;
  };

  const generateTrial = (id: number, mapping: {[key: string]: string}, action: ProcessingAction): Trial => {
    const symbols: Symbol[] = [];
    const symbolKeys = Object.keys(mapping);
    
    for (let i = 0; i < action.gridSize; i++) {
      const symbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
      symbols.push({
        id: i,
        symbol,
        code: mapping[symbol],
        position: i
      });
    }

    return {
      id,
      symbols,
      userAnswers: new Array(action.gridSize).fill(''),
      correctAnswers: symbols.map(s => s.code),
      completed: false,
      timeSpent: 0,
      accuracy: 0
    };
  };

  const generateTrials = (action: ProcessingAction) => {
    const mapping = generateSymbolMapping(action);
    const newTrials = Array.from({ length: action.trialCount }, (_, i) => 
      generateTrial(i, mapping, action)
    );
    setTrials(newTrials);
    setCurrentTrial(0);
    setTimeLeft(action.timeLimit);
    setLevelComplete(false);
    setTotalCorrect(0);
    setCurrentInputs(new Array(action.gridSize).fill(''));
    setTotalResponseTime(0);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...currentInputs];
    newInputs[index] = value.toUpperCase();
    setCurrentInputs(newInputs);
  };

  const submitTrial = () => {
    if (!currentAction) return;
    
    const timeSpent = Date.now() - trialStartTime;
    setTotalResponseTime(prev => prev + timeSpent);
    const trial = trials[currentTrial];
    
    const correct = currentInputs.reduce((acc, input, index) => {
      return acc + (input === trial.correctAnswers[index] ? 1 : 0);
    }, 0);
    
    const accuracy = correct / currentAction.gridSize;
    
    const updatedTrial = {
      ...trial,
      userAnswers: [...currentInputs],
      completed: true,
      timeSpent,
      accuracy
    };

    setTrials(prev => {
      const updated = [...prev];
      updated[currentTrial] = updatedTrial;
      return updated;
    });

    const timeBonus = Math.max(0, 20 - Math.floor(timeSpent / 1000));
    const accuracyPoints = Math.floor(accuracy * 50);
    const speedBonus = correct > 0 ? Math.floor((currentAction.gridSize / (timeSpent / 1000)) * 2) : 0;
    const points = accuracyPoints + timeBonus + speedBonus;
    
    setScore(prev => prev + points);
    setTotalCorrect(prev => prev + correct);

    setTimeout(() => {
      if (currentTrial + 1 >= currentAction.trialCount) {
        completeLevel();
      } else {
        setCurrentTrial(prev => prev + 1);
        setCurrentInputs(new Array(currentAction.gridSize).fill(''));
        setTrialStartTime(Date.now());
      }
    }, 1500);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    if (!currentAction) return;
    
    const completedTrials = trials.filter(t => t.completed);
    const totalPossible = currentAction.trialCount * currentAction.gridSize;
    const accuracy = totalCorrect / totalPossible;
    const avgResponseTime = completedTrials.length > 0 
      ? completedTrials.reduce((sum, t) => sum + t.timeSpent, 0) / completedTrials.length 
      : 3000;
    
    const accuracyBonus = Math.floor(accuracy * 100);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);

    // Update bandit
    const context = buildContext();
    const metrics = {
      completed: true,
      accuracy,
      timeEfficiency: timeLeft / currentAction.timeLimit,
      engagement: 0.8,
      frustration: accuracy < 0.5 ? 0.6 : 0.2,
      optimalMoves: totalPossible,
      actualMoves: totalPossible,
      avgReactionTime: avgResponseTime,
      codingAccuracy: accuracy,
      processingSpeed: avgResponseTime > 0 ? Math.min(1, 2000 / avgResponseTime) : 0.5,
    };
    
    const reward = processingSpeedBandit.calculateReward(metrics);
    processingSpeedBandit.updateModel(context, currentAction, reward, metrics);
  };

  const proceedToNextLevel = () => {
    const context = buildContext();
    const nextLevel = processingSpeedBandit.getOptimalLevel(context);
    
    if (nextLevel > 25 || (currentLevel >= 25 && totalCorrect > (currentAction?.trialCount || 8) * (currentAction?.gridSize || 12) * 0.7)) {
      endGame();
    } else {
      setCurrentLevel(nextLevel);
      setLevelComplete(false);
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 800) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setTrialStartTime(Date.now());
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

  const banditStats = processingSpeedBandit.getStats();
  const nextDifficulty = processingSpeedBandit.predictNextLevelDifficulty(buildContext());
  const performanceInsight = processingSpeedBandit.getPerformanceInsight(buildContext());

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Speed Champion!</h2>
            <p className="text-muted-foreground mb-4">
              You reached level {currentLevel} with {totalCorrect} correct entries!
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
            <Zap className="h-10 w-10 text-white" />
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
                <p className="text-xl font-bold text-success">{totalCorrect}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
          </div>
          <Button onClick={proceedToNextLevel} className="btn-primary w-full">
            Continue to Level {processingSpeedBandit.getOptimalLevel(buildContext())}
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
                <h1 className="text-2xl font-bold text-foreground">Processing Speed - Level {currentLevel}</h1>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Adaptive
                </span>
              </div>
              <p className="text-muted-foreground">Enter the codes for symbols as quickly as possible!</p>
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

        {/* Symbol Key */}
        {gameStarted && Object.keys(symbolMapping).length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Symbol-Code Key</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {Object.entries(symbolMapping).map(([symbol, code]) => (
                <div key={symbol} className="text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="text-2xl mb-1">{symbol}</div>
                  <div className="text-lg font-bold text-primary">{code}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Stats */}
        {gameStarted && currentAction && (
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
              <p className="text-lg font-bold text-foreground">{currentTrial + 1}/{currentAction.trialCount}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-lg font-bold text-foreground">{score}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="text-lg font-bold text-success">{totalCorrect}</p>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="glass-card p-8">
          <div className="text-center space-y-8">
            {!gameStarted ? (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Zap className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Processing Speed Training</h2>
                  <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                    <p className="text-sm text-muted-foreground">⚡ Match symbols to their codes</p>
                    <p className="text-sm text-muted-foreground">🎯 Work as fast as possible</p>
                    <p className="text-sm text-muted-foreground">🔢 Use the symbol key above</p>
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
                  <Zap className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
              </div>
            ) : trials.length > 0 && currentTrial < trials.length && currentAction ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    Enter the code for each symbol:
                  </h3>
                  
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
                    {trials[currentTrial].symbols.map((symbolObj, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-3xl font-bold text-center p-3 bg-secondary/20 rounded-lg">
                          {symbolObj.symbol}
                        </div>
                        <input
                          type="text"
                          value={currentInputs[index] || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className="w-full h-12 text-center text-lg font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          maxLength={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && index === currentAction.gridSize - 1) {
                              submitTrial();
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={submitTrial} className="btn-primary mt-6">
                    Submit Trial
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingSpeedGame;
