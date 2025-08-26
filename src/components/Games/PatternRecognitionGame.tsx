import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Pattern {
  sequence: string[];
  options: string[];
  answer: string;
}

interface PatternRecognitionGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const SHAPES = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '⚫', '⚪', '🔺', '🔸', '⭐', '❤️'];
const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

const LEVELS = [
  { level: 1, patterns: 5, sequenceLength: 3, patternTypes: ['number'], timeLimit: 45 },
  { level: 2, patterns: 6, sequenceLength: 4, patternTypes: ['number', 'shape'], timeLimit: 50 },
  { level: 3, patterns: 7, sequenceLength: 4, patternTypes: ['number', 'shape', 'letter'], timeLimit: 55 },
  { level: 4, patterns: 8, sequenceLength: 5, patternTypes: ['number', 'shape', 'letter'], timeLimit: 60 },
  { level: 5, patterns: 10, sequenceLength: 6, patternTypes: ['number', 'shape', 'letter'], timeLimit: 65 },
];

const PatternRecognitionGame = ({ onComplete, onExit }: PatternRecognitionGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const level = LEVELS[currentLevel];

  useEffect(() => {
    generatePatterns();
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      endGame();
    }
  }, [timeLeft, gameStarted, gameComplete]);

  const generateArithmeticPattern = (items: string[], length: number): Pattern => {
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
    ];
    
    const options = [...new Set([answer, ...wrongOptions])].slice(0, 4);
    return { sequence, options: shuffleArray(options), answer };
  };

  const generateShapePattern = (items: string[], length: number): Pattern => {
    const patternType = Math.random() < 0.5 ? 'repeat' : 'sequence';
    const sequence: string[] = [];
    
    if (patternType === 'repeat') {
      const patternLength = Math.min(3, Math.floor(length / 2));
      const basePattern = shuffleArray(items).slice(0, patternLength);
      
      for (let i = 0; i < length; i++) {
        sequence.push(basePattern[i % patternLength]);
      }
      
      const answer = basePattern[length % patternLength];
      const wrongOptions = shuffleArray(items.filter(item => item !== answer)).slice(0, 3);
      const options = [answer, ...wrongOptions];
      
      return { sequence, options: shuffleArray(options), answer };
    } else {
      const shuffled = shuffleArray(items);
      for (let i = 0; i < length; i++) {
        sequence.push(shuffled[i % shuffled.length]);
      }
      
      const answer = shuffled[length % shuffled.length];
      const wrongOptions = shuffleArray(items.filter(item => item !== answer)).slice(0, 3);
      const options = [answer, ...wrongOptions];
      
      return { sequence, options: shuffleArray(options), answer };
    }
  };

  const generateLetterPattern = (items: string[], length: number): Pattern => {
    const start = Math.floor(Math.random() * 5);
    const step = Math.floor(Math.random() * 2) + 1;
    const sequence: string[] = [];
    
    for (let i = 0; i < length; i++) {
      const index = (start + i * step) % items.length;
      sequence.push(items[index]);
    }
    
    const answerIndex = (start + length * step) % items.length;
    const answer = items[answerIndex];
    
    const wrongOptions = items.filter(item => item !== answer).slice(0, 3);
    const options = [answer, ...wrongOptions];
    
    return { sequence, options: shuffleArray(options), answer };
  };

  const generatePatterns = () => {
    const newPatterns: Pattern[] = [];
    
    for (let i = 0; i < level.patterns; i++) {
      const patternType = level.patternTypes[Math.floor(Math.random() * level.patternTypes.length)];
      let pattern: Pattern;
      
      switch (patternType) {
        case 'number':
          pattern = generateArithmeticPattern(NUMBERS, level.sequenceLength);
          break;
        case 'shape':
          pattern = generateShapePattern(SHAPES, level.sequenceLength);
          break;
        case 'letter':
          pattern = generateLetterPattern(LETTERS, level.sequenceLength);
          break;
        default:
          pattern = generateArithmeticPattern(NUMBERS, level.sequenceLength);
      }
      
      newPatterns.push(pattern);
    }
    
    setPatterns(newPatterns);
    setCurrentPattern(0);
    setTimeLeft(level.timeLimit);
    setCorrectAnswers(0);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === patterns[currentPattern].answer;
    setLastCorrect(isCorrect);
    
    if (isCorrect) {
      const points = Math.floor(100 / level.patterns);
      setScore(prev => prev + points);
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer('');
      setLastCorrect(null);
      
      if (currentPattern + 1 >= level.patterns) {
        completeLevel();
      } else {
        setCurrentPattern(prev => prev + 1);
      }
    }, 1500);
  };

  const completeLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
      }, 2000);
    } else {
      endGame();
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / (LEVELS.length * 100)) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameStarted(false);
    setGameComplete(false);
    generatePatterns();
  };

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
              You completed all {LEVELS.length} levels with {correctAnswers} correct patterns!
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
              <h1 className="text-2xl font-bold text-foreground">Pattern Recognition - Level {currentLevel + 1}</h1>
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
            <p className="text-2xl font-bold text-foreground">{currentPattern + 1}/{level.patterns}</p>
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
                <p className="text-sm text-muted-foreground">📈 {LEVELS.length} challenging levels</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                <p className="text-xs text-muted-foreground">
                  {level.patterns} patterns • {level.timeLimit} seconds
                </p>
              </div>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Puzzle className="h-4 w-4 mr-2" />
              Start Level {currentLevel + 1}
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
                  <div className="flex items-center justify-center space-x-4 mb-8">
                    {currentPatternData.sequence.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-lg flex items-center justify-center text-2xl font-bold">
                          {item}
                        </div>
                        {index < currentPatternData.sequence.length - 1 && (
                          <span className="mx-2 text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                    <span className="mx-2 text-muted-foreground">→</span>
                    <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/30 rounded-lg flex items-center justify-center text-2xl font-bold border-2 border-dashed border-accent">
                      ?
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentPatternData.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={`
                        w-full h-20 rounded-lg text-2xl font-bold transition-all duration-200 focus-ring
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