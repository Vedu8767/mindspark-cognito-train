import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Brain, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { wordMemoryBandit, type WordMemoryContext, type WordMemoryAction } from '@/lib/bandit/wordMemoryBandit';

interface WordMemoryGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

// Expanded word lists by complexity
const WORD_LISTS = {
  simple: ['CAT', 'DOG', 'SUN', 'CAR', 'BOOK', 'HAT', 'BAG', 'PEN', 'CUP', 'KEY', 'BED', 'BOX', 'MAP', 'TOY', 'BUS'],
  medium: ['APPLE', 'CHAIR', 'WATER', 'MUSIC', 'HAPPY', 'GREEN', 'PHONE', 'TABLE', 'SMILE', 'LIGHT', 'DREAM', 'CLOUD', 'BRAVE', 'DANCE', 'MAGIC'],
  complex: ['COMPUTER', 'ELEPHANT', 'RAINBOW', 'MOUNTAIN', 'BUTTERFLY', 'HOSPITAL', 'LIBRARY', 'ADVENTURE', 'CHOCOLATE', 'TELEPHONE', 'UMBRELLA', 'KEYBOARD', 'NEWSPAPER', 'BEAUTIFUL', 'FRIENDSHIP'],
  advanced: ['REFRIGERATOR', 'CONSTELLATION', 'ARCHITECTURE', 'INVESTIGATION', 'EXTRAORDINARY', 'RESPONSIBILITY', 'COMMUNICATION', 'UNDERSTANDING', 'OPPORTUNITY', 'IMAGINATION', 'ANNIVERSARY', 'TRANSFORMATION', 'REVOLUTIONARY', 'ACCOMPLISHMENT', 'SOPHISTICATED']
};

const WordMemoryGame = ({ onComplete, onExit }: WordMemoryGameProps) => {
  const [gamePhase, setGamePhase] = useState<'instructions' | 'study' | 'recall' | 'results' | 'complete'>('instructions');
  const [wordsToStudy, setWordsToStudy] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<string[]>([]);
  const [levelsCompleted, setLevelsCompleted] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState(0);
  
  // Bandit-related state
  const [currentAction, setCurrentAction] = useState<WordMemoryAction | null>(null);
  const [banditStats, setBanditStats] = useState(wordMemoryBandit.getStats());
  const [nextLevelPrediction, setNextLevelPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState('');

  const getContext = (): WordMemoryContext => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    
    return {
      currentLevel: banditStats.currentLevel,
      recentAccuracy: correctWords.length / Math.max(1, wordsToStudy.length),
      avgRecallTime: 0,
      orderBonusRate: 0.5,
      gamesPlayed: banditStats.totalPulls,
      sessionDuration: (Date.now() - levelStartTime) / 1000,
      timeOfDay,
      userType: 'balanced',
      memoryStrength: 0.5
    };
  };

  useEffect(() => {
    if ((gamePhase === 'study' || gamePhase === 'recall') && currentAction) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        if (gamePhase === 'study') {
          setGamePhase('recall');
          setTimeLeft(currentAction.recallTime);
        } else if (gamePhase === 'recall') {
          evaluateResults();
        }
      }
    }
  }, [timeLeft, gamePhase, currentAction]);

  const getWordsForComplexity = (complexity: string, count: number): string[] => {
    const wordList = WORD_LISTS[complexity as keyof typeof WORD_LISTS] || WORD_LISTS.simple;
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, wordList.length));
  };

  const startLevel = () => {
    const context = getContext();
    const action = wordMemoryBandit.selectAction(context);
    setCurrentAction(action);
    
    const words = getWordsForComplexity(action.wordComplexity, action.wordCount);
    setWordsToStudy(words);
    setGamePhase('study');
    setTimeLeft(action.studyTime);
    setRecalledWords([]);
    setUserInput('');
    setCorrectWords([]);
    setIncorrectWords([]);
    setLevelStartTime(Date.now());
    
    setBanditStats(wordMemoryBandit.getStats());
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
    
    // Update bandit model
    if (currentAction) {
      const accuracy = correct.length / Math.max(1, wordsToStudy.length);
      const orderBonusRate = orderBonus / Math.max(1, correct.length * 2);
      const recallSpeed = timeLeft / Math.max(1, currentAction.recallTime);
      
      const context = getContext();
      const reward = wordMemoryBandit.calculateReward({
        accuracy,
        orderBonus: orderBonusRate,
        recallSpeed,
        completion: correct.length >= wordsToStudy.length * 0.5,
        timeRemaining: timeLeft
      });
      
      wordMemoryBandit.updateModel(context, currentAction, reward, {
        accuracy,
        orderBonus: orderBonusRate,
        recallSpeed
      });
      
      // Update predictions
      setNextLevelPrediction(wordMemoryBandit.predictNextLevelDifficulty(context));
      setPerformanceInsight(wordMemoryBandit.getPerformanceInsight(context));
      setBanditStats(wordMemoryBandit.getStats());
    }
    
    setGamePhase('results');
  };

  const calculateOrderBonus = (correct: string[]): number => {
    let bonus = 0;
    for (let i = 0; i < correct.length; i++) {
      const originalIndex = wordsToStudy.indexOf(correct[i]);
      const recalledIndex = recalledWords.indexOf(correct[i]);
      if (originalIndex === recalledIndex) {
        bonus += 2;
      }
    }
    return bonus;
  };

  const nextLevel = () => {
    setLevelsCompleted(prev => prev + 1);
    if (levelsCompleted >= 4) {
      completeGame();
    } else {
      setGamePhase('instructions');
    }
  };

  const completeGame = () => {
    setGamePhase('complete');
    const finalScore = Math.min(100, Math.floor((score / 300) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const restartGame = () => {
    setScore(0);
    setLevelsCompleted(0);
    setGamePhase('instructions');
    setBanditStats(wordMemoryBandit.getStats());
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
              You completed {levelsCompleted + 1} levels of adaptive word memory training!
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
          {/* AI Badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">AI Adaptive</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Word Memory - Level {banditStats.currentLevel}</h2>
            <div className="text-left space-y-2 mb-6">
              <p className="text-sm text-muted-foreground">📚 Study the words carefully during study phase</p>
              <p className="text-sm text-muted-foreground">✍️ Then recall as many words as you can</p>
              <p className="text-sm text-muted-foreground">🎯 Bonus points for recalling in correct order</p>
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
          <Button onClick={startLevel} className="w-full btn-primary">
            <Brain className="h-4 w-4 mr-2" />
            Start Level {banditStats.currentLevel}
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'study' && currentAction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="glass-card-strong p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">Study Phase - Level {currentAction.level}</h1>
                  <div className="px-2 py-0.5 bg-purple-500/20 rounded-full">
                    <span className="text-xs text-purple-300">AI</span>
                  </div>
                </div>
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
              <h3 className="text-xl font-semibold text-foreground">Study these {currentAction.wordCount} words:</h3>
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

  if (gamePhase === 'recall' && currentAction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="glass-card-strong p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recall Phase - Level {currentAction.level}</h1>
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
                  Words recalled: {recalledWords.length}/{currentAction.wordCount}
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

  if (gamePhase === 'results' && currentAction) {
    const missedWords = wordsToStudy.filter(word => !correctWords.includes(word));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-2xl w-full space-y-6">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentAction.level} Complete!</h2>
            <p className="text-muted-foreground">Here's how you did:</p>
          </div>

          {/* AI Insight */}
          <div className={`bg-gradient-to-r ${getDifficultyColor()} p-4 rounded-lg border`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">AI Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{performanceInsight}</p>
            <div className="flex items-center gap-2">
              {getDifficultyIcon()}
              <span className="text-sm text-muted-foreground">
                Next level will be <span className="font-medium text-foreground">{nextLevelPrediction}</span>
              </span>
            </div>
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

  return null;
};

export default WordMemoryGame;
