import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Calculator, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const LEVELS = [
  { level: 1, operations: ['add', 'subtract'], maxNumber: 10, problems: 8, timeLimit: 60 },
  { level: 2, operations: ['add', 'subtract'], maxNumber: 25, problems: 10, timeLimit: 75 },
  { level: 3, operations: ['add', 'subtract', 'multiply'], maxNumber: 15, problems: 12, timeLimit: 90 },
  { level: 4, operations: ['add', 'subtract', 'multiply'], maxNumber: 20, problems: 15, timeLimit: 105 },
  { level: 5, operations: ['add', 'subtract', 'multiply', 'divide'], maxNumber: 30, problems: 18, timeLimit: 120 },
];

const MathChallengeGame = ({ onComplete, onExit }: MathChallengeGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState(0);

  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (currentLevel < LEVELS.length) {
      generateProblems();
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

  const generateProblem = (id: number): Problem => {
    const operation = level.operations[Math.floor(Math.random() * level.operations.length)];
    let a: number, b: number, answer: number, expression: string;

    switch (operation) {
      case 'add':
        a = Math.floor(Math.random() * level.maxNumber) + 1;
        b = Math.floor(Math.random() * level.maxNumber) + 1;
        answer = a + b;
        expression = `${a} + ${b}`;
        break;
      case 'subtract':
        a = Math.floor(Math.random() * level.maxNumber) + 5;
        b = Math.floor(Math.random() * (a - 1)) + 1;
        answer = a - b;
        expression = `${a} - ${b}`;
        break;
      case 'multiply':
        a = Math.floor(Math.random() * Math.min(level.maxNumber / 2, 12)) + 1;
        b = Math.floor(Math.random() * Math.min(level.maxNumber / 2, 12)) + 1;
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
    while (options.length < 4) {
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
  };

  const generateProblems = () => {
    const newProblems = Array.from({ length: level.problems }, (_, i) => 
      generateProblem(i)
    );
    setProblems(newProblems);
    setCurrentProblem(0);
    setTimeLeft(level.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setStreak(0);
  };

  const handleAnswer = (selectedAnswer: number) => {
    const timeSpent = Date.now() - problemStartTime;
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
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentProblem + 1 >= level.problems) {
        completeLevel();
      } else {
        setCurrentProblem(prev => prev + 1);
        setProblemStartTime(Date.now());
      }
    }, 1000);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    // Calculate level completion bonus
    const accuracyBonus = Math.floor((correct / level.problems) * 50);
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
    const finalScore = Math.min(100, Math.floor((score / 300) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setProblemStartTime(Date.now());
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
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
              You completed all {LEVELS.length} levels with {correct} correct answers!
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
            <Calculator className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Complete!</h2>
            <p className="text-muted-foreground">
              Great mathematical thinking! Moving to the next challenge.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{level.problems}</p>
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
      <div className="container mx-auto max-w-2xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Math Challenge - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Solve math problems as quickly as possible!</p>
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
              <Timer className="h-4 w-4 text-foreground" />
              <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Problem</p>
            <p className="text-lg font-bold text-foreground">{currentProblem + 1}/{level.problems}</p>
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

        {/* Game Area */}
        <div className="glass-card p-8">
          <div className="text-center space-y-8">
            {!gameStarted ? (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Calculator className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Math Challenge</h2>
                  <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                    <p className="text-sm text-muted-foreground">🧮 Solve math problems quickly</p>
                    <p className="text-sm text-muted-foreground">⚡ Speed bonus for fast answers</p>
                    <p className="text-sm text-muted-foreground">🔥 Build streaks for extra points</p>
                    <p className="text-sm text-muted-foreground">📈 {LEVELS.length} difficulty levels</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.problems} problems in {level.timeLimit} seconds
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
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
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