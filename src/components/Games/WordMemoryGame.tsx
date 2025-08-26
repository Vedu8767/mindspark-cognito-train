import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WordMemoryGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const WORD_LISTS = [
  // Level 1 - Simple words
  ['CAT', 'DOG', 'SUN', 'CAR', 'BOOK'],
  // Level 2 - Medium words  
  ['APPLE', 'CHAIR', 'WATER', 'MUSIC', 'HAPPY', 'GREEN'],
  // Level 3 - Longer words
  ['COMPUTER', 'ELEPHANT', 'RAINBOW', 'MOUNTAIN', 'BUTTERFLY', 'HOSPITAL', 'LIBRARY'],
  // Level 4 - Complex words
  ['PHOTOGRAPH', 'DICTIONARY', 'ADVENTURE', 'CHOCOLATE', 'TELEPHONE', 'UMBRELLA', 'KEYBOARD', 'NEWSPAPER'],
  // Level 5 - Advanced words
  ['REFRIGERATOR', 'CONSTELLATION', 'ARCHITECTURE', 'INVESTIGATION', 'EXTRAORDINARY', 'RESPONSIBILITY', 'COMMUNICATION', 'UNDERSTANDING', 'OPPORTUNITY']
];

const LEVELS = [
  { level: 1, studyTime: 10, recallTime: 20, words: 5 },
  { level: 2, studyTime: 12, recallTime: 25, words: 6 },
  { level: 3, studyTime: 15, recallTime: 30, words: 7 },
  { level: 4, studyTime: 18, recallTime: 35, words: 8 },
  { level: 5, studyTime: 20, recallTime: 40, words: 9 },
];

const WordMemoryGame = ({ onComplete, onExit }: WordMemoryGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gamePhase, setGamePhase] = useState<'instructions' | 'study' | 'recall' | 'results' | 'complete'>('instructions');
  const [wordsToStudy, setWordsToStudy] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<string[]>([]);

  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (gamePhase === 'study' || gamePhase === 'recall') {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        if (gamePhase === 'study') {
          setGamePhase('recall');
          setTimeLeft(level.recallTime);
        } else if (gamePhase === 'recall') {
          evaluateResults();
        }
      }
    }
  }, [timeLeft, gamePhase, level]);

  const startLevel = () => {
    const words = WORD_LISTS[currentLevel].slice(0, level.words);
    setWordsToStudy(words);
    setGamePhase('study');
    setTimeLeft(level.studyTime);
    setCurrentWordIndex(0);
    setRecalledWords([]);
    setUserInput('');
    setCorrectWords([]);
    setIncorrectWords([]);
  };

  const handleWordSubmit = () => {
    const word = userInput.trim().toUpperCase();
    if (word && !recalledWords.includes(word)) {
      setRecalledWords(prev => [...prev, word]);
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWordSubmit();
    }
  };

  const evaluateResults = () => {
    const correct: string[] = [];
    const incorrect: string[] = [];
    
    recalledWords.forEach(word => {
      if (wordsToStudy.includes(word)) {
        correct.push(word);
      } else {
        incorrect.push(word);
      }
    });
    
    setCorrectWords(correct);
    setIncorrectWords(incorrect);
    
    // Calculate score
    const correctPoints = correct.length * 10;
    const incorrectPenalty = incorrect.length * 2;
    const orderBonus = calculateOrderBonus(correct);
    const levelScore = Math.max(0, correctPoints - incorrectPenalty + orderBonus);
    
    setScore(prev => prev + levelScore);
    setGamePhase('results');
  };

  const calculateOrderBonus = (correct: string[]): number => {
    let bonus = 0;
    for (let i = 0; i < correct.length; i++) {
      const originalIndex = wordsToStudy.indexOf(correct[i]);
      const recalledIndex = recalledWords.indexOf(correct[i]);
      if (originalIndex === recalledIndex) {
        bonus += 2; // Bonus for correct order
      }
    }
    return bonus;
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1);
      setGamePhase('instructions');
    } else {
      completeGame();
    }
  };

  const completeGame = () => {
    setGamePhase('complete');
    const finalScore = Math.min(100, Math.floor((score / (LEVELS.length * 100)) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGamePhase('instructions');
  };

  if (gamePhase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Memory Champion!</h2>
            <p className="text-muted-foreground mb-4">
              You completed all {LEVELS.length} levels of word memory training!
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-lg font-bold text-primary">Total Score: {score}</p>
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

  if (gamePhase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Word Memory - Level {currentLevel + 1}</h2>
            <div className="text-left space-y-2 mb-6">
              <p className="text-sm text-muted-foreground">📚 Study {level.words} words for {level.studyTime} seconds</p>
              <p className="text-sm text-muted-foreground">✍️ Then recall as many as you can</p>
              <p className="text-sm text-muted-foreground">🎯 Bonus points for correct order</p>
              <p className="text-sm text-muted-foreground">⚡ {level.recallTime} seconds to recall</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
              <p className="text-xs text-muted-foreground">
                Study: {level.studyTime}s • Recall: {level.recallTime}s
              </p>
            </div>
          </div>
          <Button onClick={startLevel} className="w-full btn-primary">
            <Brain className="h-4 w-4 mr-2" />
            Start Level {currentLevel + 1}
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'study') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="glass-card-strong p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Study Phase - Level {currentLevel + 1}</h1>
                <p className="text-muted-foreground">Memorize these words!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold text-foreground">{timeLeft}s</p>
              </div>
            </div>
          </div>

          {/* Words Display */}
          <div className="glass-card p-8">
            <div className="text-center space-y-8">
              <h3 className="text-xl font-semibold text-foreground">Study these words:</h3>
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                {wordsToStudy.map((word, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg border-2 border-primary/30"
                  >
                    <span className="text-2xl font-bold text-foreground">{word}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{timeLeft}</span>
                </div>
                <p className="text-muted-foreground mt-2">Time remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'recall') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="glass-card-strong p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recall Phase - Level {currentLevel + 1}</h1>
                <p className="text-muted-foreground">Type the words you remember!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold text-foreground">{timeLeft}s</p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="glass-card p-8 mb-6">
            <div className="space-y-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a word and press Enter"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-card-border focus:border-primary bg-card text-foreground placeholder-muted-foreground focus:outline-none"
                  autoFocus
                />
                <Button onClick={handleWordSubmit} className="btn-primary">
                  Add Word
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Words recalled: {recalledWords.length}
                </p>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{timeLeft}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recalled Words Display */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Words you've recalled:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recalledWords.map((word, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-accent/10 to-accent/20 rounded-lg border border-accent/30"
                >
                  <span className="text-foreground font-medium">{word}</span>
                </div>
              ))}
            </div>
            {recalledWords.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No words recalled yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'results') {
    const missedWords = wordsToStudy.filter(word => !correctWords.includes(word));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-2xl w-full space-y-6">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Results</h2>
            <p className="text-muted-foreground">Here's how you did:</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-success/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="text-2xl font-bold text-success">{correctWords.length}</p>
            </div>
            <div className="bg-destructive/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Incorrect</p>
              <p className="text-2xl font-bold text-destructive">{incorrectWords.length}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold text-primary">{score}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-success mb-3">✅ Correct Words</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {correctWords.map((word, index) => (
                  <div key={index} className="p-2 bg-success/10 rounded text-success font-medium">
                    {word}
                  </div>
                ))}
                {correctWords.length === 0 && (
                  <p className="text-muted-foreground text-sm">None</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-3">❌ Missed Words</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {missedWords.map((word, index) => (
                  <div key={index} className="p-2 bg-muted/10 rounded text-muted-foreground font-medium">
                    {word}
                  </div>
                ))}
                {missedWords.length === 0 && (
                  <p className="text-muted-foreground text-sm">None - Perfect!</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={nextLevel} className="flex-1 btn-primary">
              {currentLevel < LEVELS.length - 1 ? 'Next Level' : 'Complete Game'}
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

  return null;
};

export default WordMemoryGame;