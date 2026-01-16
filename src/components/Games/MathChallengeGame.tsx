import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Calculator, Timer, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mathChallengeBandit, type MathContext, type MathAction } from '@/lib/bandit/mathChallengeBandit';

interface MathChallengeGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Problem {
  id: number;
  expression: string;
  answer: number;
  options: number[];
  userAnswer?: number;
  correct?: boolean;
  timeSpent?: number;
}

const MathChallengeGame = ({ onComplete, onExit }: MathChallengeGameProps) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [levelsCompleted, setLevelsCompleted] = useState(0);
  const [totalProblemsTime, setTotalProblemsTime] = useState(0);
  
  // Bandit-related state
  const [currentAction, setCurrentAction] = useState<MathAction | null>(null);
  const [banditStats, setBanditStats] = useState(mathChallengeBandit.getStats());
  const [nextLevelPrediction, setNextLevelPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState('');

  const getContext = (): MathContext => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    
    return {
      currentLevel: banditStats.currentLevel,
      recentAccuracy: correct / Math.max(1, currentProblem),
      avgSolveTime: totalProblemsTime / Math.max(1, currentProblem) / 1000,
      streakRate: maxStreak / Math.max(1, currentProblem),
      gamesPlayed: banditStats.totalPulls,
      sessionDuration: 0,
      timeOfDay,
      userType: 'balanced',
      mathStrength: 0.5,
      preferredOperations: []
    };
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete && currentAction) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete, currentAction]);

  const generateProblem = useCallback((id: number, action: MathAction): Problem => {
    const operation = action.operations[Math.floor(Math.random() * action.operations.length)];
    let a: number, b: number, answer: number, expression: string;

    switch (operation) {
      case 'add':
        a = Math.floor(Math.random() * action.maxNumber) + 1;
        b = Math.floor(Math.random() * action.maxNumber) + 1;
        answer = a + b;
        expression = `${a} + ${b}`;
        break;
      case 'subtract':
        a = Math.floor(Math.random() * action.maxNumber) + 5;
        b = Math.floor(Math.random() * (a - 1)) + 1;
        answer = a - b;
        expression = `${a} - ${b}`;
        break;
      case 'multiply':
        a = Math.floor(Math.random() * Math.min(action.maxNumber / 2, 12)) + 1;
        b = Math.floor(Math.random() * Math.min(action.maxNumber / 2, 12)) + 1;
        answer = a * b;
        expression = `${a} × ${b}`;
        break;
      case 'divide':
        b = Math.floor(Math.random() * 8) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
        expression = `${a} ÷ ${b}`;
        break;
      default:
        a = 1; b = 1; answer = 2; expression = '1 + 1';
    }

    // Generate wrong options
    const options = [answer];
    const optionCount = action.optionCount || 4;
    while (options.length < optionCount) {
      const wrongAnswer = answer + Math.floor(Math.random() * 10) - 5;
      if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return { id, expression, answer, options };
  }, []);

  const generateProblems = useCallback((action: MathAction) => {
    const newProblems = Array.from({ length: action.problemCount }, (_, i) => 
      generateProblem(i, action)
    );
    setProblems(newProblems);
    setCurrentProblem(0);
    setTimeLeft(action.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalProblemsTime(0);
  }, [generateProblem]);

  const handleAnswer = (selectedAnswer: number) => {
    const timeSpent = Date.now() - problemStartTime;
    setTotalProblemsTime(prev => prev + timeSpent);
    
    const problem = problems[currentProblem];
    const isCorrect = selectedAnswer === problem.answer;
    
    const updatedProblem = {
      ...problem,
      userAnswer: selectedAnswer,
      correct: isCorrect,
      timeSpent
    };

    setProblems(prev => {
      const updated = [...prev];
      updated[currentProblem] = updatedProblem;
      return updated;
    });

    if (isCorrect) {
      const timeBonus = Math.max(0, 10 - Math.floor(timeSpent / 1000));
      const streakBonus = Math.floor(streak / 3) * 5;
      const points = 10 + timeBonus + streakBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentAction && currentProblem + 1 >= currentAction.problemCount) {
        completeLevel();
      } else {
        setCurrentProblem(prev => prev + 1);
        setProblemStartTime(Date.now());
      }
    }, 500);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    if (currentAction) {
      // Calculate level completion bonus
      const accuracyBonus = Math.floor((correct / currentAction.problemCount) * 50);
      const timeBonus = Math.floor(timeLeft * 2);
      setScore(prev => prev + accuracyBonus + timeBonus);
      
      // Update bandit model
      const accuracy = correct / currentAction.problemCount;
      const avgSpeed = totalProblemsTime / Math.max(1, correct) / 1000;
      
      const context = getContext();
      const reward = mathChallengeBandit.calculateReward({
        accuracy,
        avgSpeed,
        streakMax: maxStreak,
        completion: correct >= currentAction.problemCount * 0.5,
        timeRemaining: timeLeft
      });
      
      mathChallengeBandit.updateModel(context, currentAction, reward, {
        accuracy,
        avgSpeed,
        streakMax: maxStreak
      });
      
      // Update predictions
      setNextLevelPrediction(mathChallengeBandit.predictNextLevelDifficulty(context));
      setPerformanceInsight(mathChallengeBandit.getPerformanceInsight(context));
      setBanditStats(mathChallengeBandit.getStats());
    }
  };

  const nextLevel = () => {
    setLevelsCompleted(prev => prev + 1);
    if (levelsCompleted >= 4) {
      endGame();
    } else {
      setLevelComplete(false);
      setGameStarted(false);
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 500) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    const context = getContext();
    const action = mathChallengeBandit.selectAction(context);
    setCurrentAction(action);
    generateProblems(action);
    setGameStarted(true);
    setProblemStartTime(Date.now());
    setBanditStats(mathChallengeBandit.getStats());
  };

  const restartGame = () => {
    setScore(0);
    setLevelsCompleted(0);
    setGameComplete(false);
    setGameStarted(false);
    setLevelComplete(false);
    setBanditStats(mathChallengeBandit.getStats());
  };

  const getDifficultyIcon = () => {
    switch (nextLevelPrediction) {
      case 'harder': return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case 'easier': return <TrendingDown className="h-4 w-4 text-green-400" />;
      default: return <Minus className="h-4 w-4 text-blue-400" />;
    }
  };

  const getDifficultyColor = () => {
    switch (nextLevelPrediction) {
      case 'harder': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      case 'easier': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default: return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Math Master!</h2>
            <p className="text-muted-foreground mb-4">
              You completed {levelsCompleted + 1} levels with excellent performance!
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
            <Calculator className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentAction.level} Complete!</h2>
            <p className="text-muted-foreground">
              Great mathematical thinking!
            </p>
            
            {/* AI Insight */}
            <div className={`bg-gradient-to-r ${getDifficultyColor()} p-4 rounded-lg border mt-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-foreground">AI Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{performanceInsight}</p>
              <div className="flex items-center gap-2 justify-center">
                {getDifficultyIcon()}
                <span className="text-sm text-muted-foreground">
                  Next level will be <span className="font-medium text-foreground">{nextLevelPrediction}</span>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{currentAction.problemCount}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-xl font-bold text-accent">{maxStreak}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button onClick={nextLevel} className="flex-1 btn-primary">
              {levelsCompleted >= 4 ? 'Complete Game' : 'Next Level'}
            </Button>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit
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
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  Math Challenge - Level {currentAction?.level || banditStats.currentLevel}
                </h1>
                <div className="px-2 py-0.5 bg-purple-500/20 rounded-full">
                  <span className="text-xs text-purple-300">AI Adaptive</span>
                </div>
              </div>
              <p className="text-muted-foreground">Solve math problems as quickly as possible!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        {gameStarted && currentAction && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Time</p>
              <div className="flex items-center justify-center space-x-1">
                <Timer className="h-4 w-4 text-foreground" />
                <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
              </div>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Problem</p>
              <p className="text-lg font-bold text-foreground">{currentProblem + 1}/{currentAction.problemCount}</p>
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
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-lg font-bold text-accent">{streak}</p>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="glass-card p-8">
          <div className="text-center space-y-8">
            {!gameStarted ? (
              <div className="space-y-6">
                {/* AI Badge */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-xs font-medium text-purple-300">AI Adaptive</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Calculator className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Math Challenge</h2>
                  <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                    <p className="text-sm text-muted-foreground">🧮 Solve math problems quickly</p>
                    <p className="text-sm text-muted-foreground">⚡ Speed bonus for fast answers</p>
                    <p className="text-sm text-muted-foreground">🔥 Build streaks for extra points</p>
                    <p className="text-sm text-muted-foreground">🤖 AI adapts difficulty to your performance</p>
                  </div>
                  
                  {/* AI Stats */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Exploration Rate</span>
                      <span className="text-purple-300">{(banditStats.epsilon * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Skill Level</span>
                      <span className="text-purple-300">{banditStats.currentLevel}/25</span>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Level {banditStats.currentLevel}</p>
                    <p className="text-xs text-muted-foreground">
                      Difficulty adapts based on your performance
                    </p>
                  </div>
                </div>
                <Button onClick={startGame} className="btn-primary">
                  <Calculator className="h-4 w-4 mr-2" />
                  Start Challenge
                </Button>
              </div>
            ) : problems.length > 0 && currentProblem < problems.length ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-foreground">
                    {problems[currentProblem].expression} = ?
                  </h3>
                  <div className={`grid gap-4 max-w-md mx-auto ${
                    currentAction && currentAction.optionCount > 4 ? 'grid-cols-3' : 'grid-cols-2'
                  }`}>
                    {problems[currentProblem].options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="h-16 text-xl font-bold bg-gradient-to-br from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-secondary-foreground"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathChallengeGame;
