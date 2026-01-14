import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Puzzle, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patternRecognitionBandit, PatternContext, PatternAction } from '@/lib/bandit/patternBandit';
import { PerformanceMetrics } from '@/lib/bandit/types';

interface Pattern {
  sequence: string[];
  options: string[];
  answer: string;
  type: 'number' | 'shape' | 'letter';
}

interface PatternRecognitionGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const SHAPES = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '⚫', '⚪', '🔺', '🔸', '⭐', '❤️'];
const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const PatternRecognitionGame = ({ onComplete, onExit }: PatternRecognitionGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(patternRecognitionBandit.getLevel());
  const [currentPattern, setCurrentPattern] = useState(0);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  
  // Bandit state
  const [currentAction, setCurrentAction] = useState<PatternAction | null>(null);
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [patternTimes, setPatternTimes] = useState<number[]>([]);
  const [patternStartTime, setPatternStartTime] = useState(0);
  const [banditStats, setBanditStats] = useState(patternRecognitionBandit.getStats());
  const [nextLevelPrediction, setNextLevelPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState<string>('');

  const getContext = useCallback((): PatternContext => {
    const avgTime = patternTimes.length > 0 
      ? patternTimes.reduce((a, b) => a + b, 0) / patternTimes.length 
      : 3000;
    
    return {
      currentLevel,
      recentAccuracy: patterns.length > 0 ? correctAnswers / Math.max(1, currentPattern) : 0.5,
      recentSpeed: avgTime < 2000 ? 1 : avgTime < 4000 ? 0.7 : 0.4,
      sessionLength: (Date.now() - levelStartTime) / 1000,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
      previousDifficulty: currentAction?.difficultyMultiplier || 1,
      streakCount: correctAnswers,
      userType: 'balanced',
      avgMoveTime: avgTime,
      frustrationLevel: correctAnswers < currentPattern * 0.3 ? 0.7 : 0.2,
      engagementLevel: 0.8,
      preferredGridSize: 4,
      successRate: correctAnswers / Math.max(1, currentPattern),
      dayOfWeek: new Date().getDay(),
      avgPatternTime: avgTime,
      patternTypePreference: 'mixed',
      sequenceRecognitionSpeed: avgTime < 2000 ? 1 : 0.5
    };
  }, [currentLevel, correctAnswers, currentPattern, patternTimes, levelStartTime, currentAction, patterns.length]);

  const generateArithmeticPattern = (length: number): Pattern => {
    const start = Math.floor(Math.random() * 5) + 1;
    const diff = Math.floor(Math.random() * 3) + 1;
    const sequence: string[] = [];
    
    for (let i = 0; i < length; i++) {
      sequence.push((start + i * diff).toString());
    }
    
    const answer = (start + length * diff).toString();
    const wrongOptions = [
      (parseInt(answer) + 1).toString(),
      (parseInt(answer) - 1).toString(),
      (parseInt(answer) + diff + 1).toString(),
      (parseInt(answer) - diff).toString(),
      (parseInt(answer) + 2).toString(),
    ];
    
    const optionCount = currentAction?.optionCount || 4;
    const options = [...new Set([answer, ...wrongOptions])].slice(0, optionCount);
    return { sequence, options: shuffleArray(options), answer, type: 'number' };
  };

  const generateShapePattern = (length: number): Pattern => {
    const patternType = Math.random() < 0.5 ? 'repeat' : 'sequence';
    const sequence: string[] = [];
    
    if (patternType === 'repeat') {
      const patternLength = Math.min(3, Math.floor(length / 2));
      const basePattern = shuffleArray(SHAPES).slice(0, patternLength);
      
      for (let i = 0; i < length; i++) {
        sequence.push(basePattern[i % patternLength]);
      }
      
      const answer = basePattern[length % patternLength];
      const optionCount = currentAction?.optionCount || 4;
      const wrongOptions = shuffleArray(SHAPES.filter(item => item !== answer)).slice(0, optionCount - 1);
      const options = [answer, ...wrongOptions];
      
      return { sequence, options: shuffleArray(options), answer, type: 'shape' };
    } else {
      const shuffled = shuffleArray(SHAPES);
      for (let i = 0; i < length; i++) {
        sequence.push(shuffled[i % shuffled.length]);
      }
      
      const answer = shuffled[length % shuffled.length];
      const optionCount = currentAction?.optionCount || 4;
      const wrongOptions = shuffleArray(SHAPES.filter(item => item !== answer)).slice(0, optionCount - 1);
      const options = [answer, ...wrongOptions];
      
      return { sequence, options: shuffleArray(options), answer, type: 'shape' };
    }
  };

  const generateLetterPattern = (length: number): Pattern => {
    const start = Math.floor(Math.random() * 5);
    const step = Math.floor(Math.random() * 2) + 1;
    const sequence: string[] = [];
    
    for (let i = 0; i < length; i++) {
      const index = (start + i * step) % LETTERS.length;
      sequence.push(LETTERS[index]);
    }
    
    const answerIndex = (start + length * step) % LETTERS.length;
    const answer = LETTERS[answerIndex];
    
    const optionCount = currentAction?.optionCount || 4;
    const wrongOptions = LETTERS.filter(item => item !== answer).slice(0, optionCount - 1);
    const options = [answer, ...wrongOptions];
    
    return { sequence, options: shuffleArray(options), answer, type: 'letter' };
  };

  const generatePatterns = useCallback(() => {
    if (!currentAction) return;
    
    const newPatterns: Pattern[] = [];
    const patternTypes = currentAction.patternTypes;
    
    for (let i = 0; i < currentAction.patternCount; i++) {
      const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
      let pattern: Pattern;
      
      switch (patternType) {
        case 'number':
          pattern = generateArithmeticPattern(currentAction.sequenceLength);
          break;
        case 'shape':
          pattern = generateShapePattern(currentAction.sequenceLength);
          break;
        case 'letter':
          pattern = generateLetterPattern(currentAction.sequenceLength);
          break;
        default:
          pattern = generateArithmeticPattern(currentAction.sequenceLength);
      }
      
      newPatterns.push(pattern);
    }
    
    setPatterns(newPatterns);
    setCurrentPattern(0);
    setTimeLeft(currentAction.timeLimit);
    setCorrectAnswers(0);
    setPatternTimes([]);
  }, [currentAction]);

  useEffect(() => {
    if (currentAction) {
      generatePatterns();
    }
  }, [currentAction, generatePatterns]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete) {
      handleLevelComplete();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    const responseTime = Date.now() - patternStartTime;
    setPatternTimes(prev => [...prev, responseTime]);
    
    setSelectedAnswer(answer);
    const isCorrect = answer === patterns[currentPattern].answer;
    setLastCorrect(isCorrect);
    
    if (isCorrect) {
      const basePoints = 100;
      const timeBonus = Math.floor((timeLeft / (currentAction?.timeLimit || 60)) * 50);
      const levelBonus = currentLevel * 10;
      setScore(prev => prev + basePoints + timeBonus + levelBonus);
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer('');
      setLastCorrect(null);
      
      if (currentPattern + 1 >= patterns.length) {
        handleLevelComplete();
      } else {
        setCurrentPattern(prev => prev + 1);
        setPatternStartTime(Date.now());
      }
    }, 1500);
  };

  const handleLevelComplete = () => {
    const context = getContext();
    const totalPatterns = patterns.length;
    const accuracy = correctAnswers / Math.max(1, totalPatterns);
    const avgTime = patternTimes.length > 0 
      ? patternTimes.reduce((a, b) => a + b, 0) / patternTimes.length 
      : 5000;
    
    const metrics: PerformanceMetrics = {
      completed: true,
      accuracy,
      timeEfficiency: Math.max(0, 1 - avgTime / 10000),
      engagement: 0.8,
      frustration: accuracy < 0.5 ? 0.6 : 0.2,
      optimalMoves: totalPatterns,
      actualMoves: currentPattern + 1,
      avgReactionTime: avgTime
    };
    
    const reward = patternRecognitionBandit.calculateReward(metrics);
    
    if (currentAction) {
      patternRecognitionBandit.updateModel(context, currentAction, reward, metrics);
    }
    
    // Get predictions for next level
    const prediction = patternRecognitionBandit.predictNextLevelDifficulty(metrics);
    const insight = patternRecognitionBandit.getPerformanceInsight(metrics);
    setNextLevelPrediction(prediction);
    setPerformanceInsight(insight);
    
    // Calculate next level (strict ±1 progression)
    const nextLevel = patternRecognitionBandit.getOptimalLevel(context);
    
    setLevelComplete(true);
    setBanditStats(patternRecognitionBandit.getStats());
    
    // Store next level for progression
    patternRecognitionBandit.setLevel(nextLevel);
  };

  const proceedToNextLevel = () => {
    const nextLevel = patternRecognitionBandit.getLevel();
    setCurrentLevel(nextLevel);
    setLevelComplete(false);
    
    // Get new action from bandit
    const context = getContext();
    const action = patternRecognitionBandit.selectAction(context);
    setCurrentAction(action);
    setLevelStartTime(Date.now());
    setPatternStartTime(Date.now());
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = score;
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    const context = getContext();
    const action = patternRecognitionBandit.selectAction(context);
    setCurrentAction(action);
    setLevelStartTime(Date.now());
    setPatternStartTime(Date.now());
    setGameStarted(true);
  };

  const restartGame = () => {
    patternRecognitionBandit.reset();
    setCurrentLevel(1);
    setScore(0);
    setGameStarted(false);
    setGameComplete(false);
    setLevelComplete(false);
    setCurrentAction(null);
    setBanditStats(patternRecognitionBandit.getStats());
  };

  // Level Complete Screen
  if (levelComplete && !gameComplete) {
    const accuracy = patterns.length > 0 ? (correctAnswers / patterns.length * 100).toFixed(0) : '0';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            <p className="text-muted-foreground">
              {correctAnswers} of {patterns.length} patterns correct ({accuracy}%)
            </p>
          </div>
          
          {/* Performance Insight */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-foreground">{performanceInsight}</p>
          </div>
          
          {/* Next Level Prediction */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
            {nextLevelPrediction === 'harder' && (
              <>
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-success font-medium">Next level will be harder</span>
              </>
            )}
            {nextLevelPrediction === 'easier' && (
              <>
                <TrendingDown className="h-5 w-5 text-warning" />
                <span className="text-warning font-medium">Next level will be easier</span>
              </>
            )}
            {nextLevelPrediction === 'same' && (
              <>
                <Minus className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">Same difficulty level</span>
              </>
            )}
          </div>
          
          {/* AI Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 p-2 rounded">
              <p className="text-muted-foreground">AI Exploration</p>
              <p className="font-semibold text-foreground">{(banditStats.epsilon * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-muted/30 p-2 rounded">
              <p className="text-muted-foreground">Skill Level</p>
              <p className="font-semibold text-foreground">{banditStats.skillLevel.toFixed(1)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button onClick={proceedToNextLevel} className="w-full btn-primary">
              Continue to Level {patternRecognitionBandit.getLevel()}
            </Button>
            <Button onClick={endGame} variant="outline" className="w-full">
              End Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Pattern Master!</h2>
            <p className="text-muted-foreground mb-4">
              You reached level {currentLevel} with {correctAnswers} correct patterns!
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

  const currentPatternData = patterns[currentPattern];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Pattern Recognition - Level {currentLevel}</h1>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Adaptive
                </span>
              </div>
              <p className="text-muted-foreground">Find the next item in the sequence!</p>
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
            <p className="text-sm text-muted-foreground">Time Left</p>
            <p className="text-2xl font-bold text-foreground">{timeLeft}s</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Pattern</p>
            <p className="text-2xl font-bold text-foreground">{currentPattern + 1}/{patterns.length || '?'}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Correct</p>
            <p className="text-2xl font-bold text-success">{correctAnswers}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
        </div>

        {!gameStarted ? (
          <div className="glass-card p-8 text-center space-y-6">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Puzzle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Pattern Recognition</h2>
              <div className="text-left max-w-md mx-auto space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">🧩 Find the next item in each sequence</p>
                <p className="text-sm text-muted-foreground">🔢 Numbers, shapes, and letters</p>
                <p className="text-sm text-muted-foreground">⏱️ Complete all patterns before time runs out</p>
                <p className="text-sm text-muted-foreground">🤖 AI adapts difficulty to your skill level</p>
                <p className="text-sm text-muted-foreground">📈 25 progressive levels</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground">Starting Level {currentLevel}</p>
                <p className="text-xs text-muted-foreground">
                  AI will adjust based on your performance
                </p>
              </div>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Puzzle className="h-4 w-4 mr-2" />
              Start Level {currentLevel}
            </Button>
          </div>
        ) : (
          <div className="glass-card p-8">
            {currentPatternData && (
              <div className="space-y-8">
                {/* Pattern Display */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-6">
                    What comes next in this sequence?
                  </h3>
                  <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
                    {currentPatternData.sequence.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-lg flex items-center justify-center text-xl md:text-2xl font-bold">
                          {item}
                        </div>
                        {index < currentPatternData.sequence.length - 1 && (
                          <span className="mx-1 md:mx-2 text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                    <span className="mx-1 md:mx-2 text-muted-foreground">→</span>
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-accent/20 to-accent/30 rounded-lg flex items-center justify-center text-xl md:text-2xl font-bold border-2 border-dashed border-accent">
                      ?
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div className={`grid gap-4 ${currentPatternData.options.length <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3 md:grid-cols-6'}`}>
                  {currentPatternData.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={`
                        w-full h-16 md:h-20 rounded-lg text-xl md:text-2xl font-bold transition-all duration-200 focus-ring
                        ${showResult && option === selectedAnswer
                          ? lastCorrect
                            ? 'bg-gradient-to-br from-success to-success-light text-white scale-105'
                            : 'bg-gradient-to-br from-destructive to-destructive-dark text-white'
                          : showResult && option === currentPatternData.answer
                          ? 'bg-gradient-to-br from-success to-success-light text-white'
                          : 'bg-gradient-to-br from-card to-card-secondary hover:from-hover hover:to-card border-2 border-card-border hover:border-primary/30 hover:scale-105'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* Result Feedback */}
                {showResult && (
                  <div className="text-center animate-bounce-in">
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                      lastCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      <span className="text-2xl mr-2">{lastCorrect ? '✅' : '❌'}</span>
                      <span className="font-semibold">
                        {lastCorrect ? 'Correct!' : `Wrong! The answer was ${currentPatternData.answer}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternRecognitionGame;
