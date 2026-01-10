import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Star, Target, Clock, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { memoryGameBandit, GameAction, UserContext } from '@/lib/bandit';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchingGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const MemoryMatchingGame = ({ onComplete, onExit }: MemoryMatchingGameProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem('memoryGameLevel');
    return saved ? parseInt(saved) : 1;
  });
  const [gameConfig, setGameConfig] = useState<GameAction | null>(null);
  const [context, setContext] = useState<UserContext | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [levelProgress, setLevelProgress] = useState(0);
  const [adaptiveTimeBonus, setAdaptiveTimeBonus] = useState(0);
  
  const analytics = useGameAnalytics();

  const allSymbols = ['🧠', '🎯', '⚡', '🌟', '🎪', '🎨', '🎭', '🔮', '🔥', '💎', '🚀', '🎵', '🌈', '⭐', '🎲', '🦋'];

  useEffect(() => {
    initializeLevel();
  }, [currentLevel]);

  const initializeLevel = () => {
    // Get context for current level with full user analytics
    const levelContext = analytics.getContext(currentLevel);
    setContext(levelContext);
    
    // Use Epsilon-Greedy Bandit to select optimal action
    const config = memoryGameBandit.selectAction(levelContext);
    setGameConfig(config);
    
    console.log('[Game] Level initialized:', {
      level: currentLevel,
      userType: levelContext.userType,
      frustration: levelContext.frustrationLevel?.toFixed(2),
      config: {
        gridSize: config.gridSize,
        timeLimit: config.timeLimit,
        symbolCount: config.symbolCount,
        difficulty: config.difficultyMultiplier.toFixed(2)
      }
    });
    
    // Initialize game with bandit-selected configuration
    initializeGame(config);
    
    // Show preview for higher levels or if user needs help
    const showPreviewLevel = currentLevel > 3 || (levelContext.frustrationLevel || 0) > 0.5;
    if (showPreviewLevel) {
      setShowPreview(true);
      setTimeout(() => setShowPreview(false), config.previewTime);
    }
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      endGame();
    }
  }, [timeLeft, gameStarted, gameComplete]);

  useEffect(() => {
    if (gameConfig && matches === gameConfig.symbolCount && !gameComplete) {
      endGame();
    }
  }, [matches, gameComplete, gameConfig]);

  // Adaptive timer: add bonus time for correct matches if enabled
  useEffect(() => {
    if (gameConfig?.adaptiveTimer && matches > 0 && gameStarted) {
      const bonus = Math.floor(3 * gameConfig.difficultyMultiplier);
      setAdaptiveTimeBonus(prev => prev + bonus);
      setTimeLeft(prev => prev + bonus);
    }
  }, [matches]);

  const initializeGame = (config?: GameAction) => {
    const activeConfig = config || gameConfig;
    if (!activeConfig) return;

    const symbols = allSymbols.slice(0, activeConfig.symbolCount);
    const cardPairs = [...symbols, ...symbols];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffledCards);
    setMatches(0);
    setMoves(0);
    setTimeLeft(activeConfig.timeLimit);
    setGameStarted(false);
    setGameComplete(false);
    setFlippedCards([]);
    setAdaptiveTimeBonus(0);
    
    // Start analytics session
    analytics.startSession(currentLevel);
  };

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) setGameStarted(true);
    if (!gameConfig) return;
    
    if (flippedCards.length === 2) return;
    if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];
      const isMatch = firstCard.value === secondCard.value;

      // Record move for analytics
      analytics.recordMove(isMatch);

      if (isMatch) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            analytics.recordMatch();
            return newMatches;
          });
          setFlippedCards([]);
        }, gameConfig.flipDuration / 2);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, gameConfig.flipDuration);
      }
    }
  };

  const endGame = () => {
    setGameComplete(true);
    
    // Check if level was completed successfully
    const levelCompleted = matches === gameConfig?.symbolCount;
    
    // End analytics session
    const session = analytics.endSession(levelCompleted, timeLeft);
    
    if (session && context && gameConfig) {
      // Update bandit with performance data
      const { performance, reward } = analytics.updateBandit(context, gameConfig, session);
      
      console.log('[Game] Performance:', {
        completed: performance.completed,
        accuracy: performance.accuracy.toFixed(2),
        reward: reward.toFixed(1)
      });
      
      // Progress to next level if completed
      if (levelCompleted && currentLevel < 25) {
        const newLevel = currentLevel + 1;
        setCurrentLevel(newLevel);
        localStorage.setItem('memoryGameLevel', newLevel.toString());
        setLevelProgress(Math.min(100, (newLevel / 25) * 100));
      }
    } else if (levelCompleted && currentLevel < 25) {
      // Fallback progression
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      localStorage.setItem('memoryGameLevel', newLevel.toString());
      setLevelProgress(Math.min(100, (newLevel / 25) * 100));
    }

    // Calculate score
    const timeBonus = Math.max(0, timeLeft * 2);
    const moveEfficiency = Math.max(0, 100 - moves * 3);
    const matchBonus = matches * 10;
    const levelBonus = currentLevel * 5;
    const score = Math.min(100, timeBonus + moveEfficiency + matchBonus + levelBonus);
    
    setTimeout(() => onComplete(score), 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextLevel = () => {
    if (currentLevel < 25) {
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      localStorage.setItem('memoryGameLevel', newLevel.toString());
      setGameComplete(false);
    }
  };

  const previousLevel = () => {
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      localStorage.setItem('memoryGameLevel', newLevel.toString());
      setGameComplete(false);
    }
  };

  const getDifficultyColor = () => {
    if (currentLevel <= 5) return 'text-emerald-500';
    if (currentLevel <= 10) return 'text-yellow-500';
    if (currentLevel <= 15) return 'text-orange-500';
    if (currentLevel <= 20) return 'text-red-500';
    return 'text-purple-500';
  };

  const getDifficultyName = () => {
    if (currentLevel <= 5) return 'Beginner';
    if (currentLevel <= 10) return 'Easy';
    if (currentLevel <= 15) return 'Medium';
    if (currentLevel <= 20) return 'Hard';
    return 'Expert';
  };

  const banditStats = analytics.getBanditStats();

  if (!gameConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto animate-pulse text-primary mb-4" />
          <p className="text-muted-foreground">AI is analyzing your playstyle...</p>
          <p className="text-xs text-muted-foreground mt-2">Epsilon-Greedy Bandit Optimization</p>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    const isWin = matches === gameConfig.symbolCount;
    const streak = analytics.getStreak();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className={`p-4 bg-gradient-to-br rounded-full w-20 h-20 mx-auto flex items-center justify-center ${
            isWin ? 'from-success to-success-light' : 'from-muted to-muted-dark'
          }`}>
            {isWin ? <Trophy className="h-10 w-10 text-white" /> : <Target className="h-10 w-10 text-white" />}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isWin ? 'Level Complete!' : 'Try Again!'}
            </h2>
            <p className="text-muted-foreground mb-4">
              Level {currentLevel} • {matches} matches • {moves} moves
            </p>
            
            {streak > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Streak: {streak}</span>
              </div>
            )}
            
            {/* AI Insights */}
            <div className="bg-primary/10 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Adaptation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Skill Level: {Math.round(banditStats.skillLevel * 100)}%</div>
                <div>Exploration: {Math.round(banditStats.epsilon * 100)}%</div>
                <div>Games Analyzed: {banditStats.totalPulls}</div>
                <div>Playstyle: {context?.userType?.replace('_', ' ')}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentLevel}/25</span>
              </div>
              <Progress value={(currentLevel / 25) * 100} className="h-2" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {currentLevel > 1 && (
              <Button onClick={previousLevel} variant="outline" className="w-full">
                ← Previous
              </Button>
            )}
            {currentLevel < 25 && isWin && (
              <Button onClick={nextLevel} className="w-full btn-primary">
                Next Level →
              </Button>
            )}
            <Button onClick={() => initializeGame()} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={onExit} className="w-full btn-primary">
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
      <div className="container mx-auto max-w-4xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Memory Matching</h1>
                <p className="text-muted-foreground">Level {currentLevel} • ε-Greedy Adaptive AI</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={getDifficultyColor()}>
                  {getDifficultyName()}
                </Badge>
                <Badge variant="outline">
                  {context?.userType?.replace('_', ' ').toUpperCase()}
                </Badge>
                {gameConfig.hintEnabled && (
                  <Badge variant="outline" className="text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Hints
                  </Badge>
                )}
                {gameConfig.adaptiveTimer && (
                  <Badge variant="outline" className="text-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Adaptive
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Level Progress</span>
              <span>{currentLevel}/25</span>
            </div>
            <Progress value={(currentLevel / 25) * 100} className="h-2" />
          </div>
          
          {/* Bandit Stats */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>AI Exploration: {Math.round(banditStats.epsilon * 100)}%</span>
            <span>•</span>
            <span>Skill: {Math.round(banditStats.skillLevel * 100)}%</span>
            <span>•</span>
            <span>Games: {banditStats.totalPulls}</span>
            {adaptiveTimeBonus > 0 && (
              <>
                <span>•</span>
                <span className="text-green-500">+{adaptiveTimeBonus}s bonus</span>
              </>
            )}
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-sm text-muted-foreground">Time Left</p>
            <p className="text-2xl font-bold text-foreground">{formatTime(timeLeft)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-sm text-muted-foreground">Moves</p>
            <p className="text-2xl font-bold text-foreground">{moves}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-sm text-muted-foreground">Matches</p>
            <p className="text-2xl font-bold text-foreground">{matches}/{gameConfig.symbolCount}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-sm text-muted-foreground">Streak</p>
            <p className="text-2xl font-bold text-foreground">{analytics.getStreak()}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="glass-card p-6 relative">
          {showPreview && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
                <p className="text-lg font-medium text-foreground mb-2">Preview Mode</p>
                <p className="text-sm text-muted-foreground">Study the pattern...</p>
              </div>
            </div>
          )}
          
          <div 
            className={`grid gap-4 mx-auto max-w-2xl`}
            style={{ 
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(gameConfig.symbolCount * 2))}, 1fr)`,
            }}
          >
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || flippedCards.length === 2 || showPreview}
                className={`
                  aspect-square rounded-lg text-2xl md:text-3xl font-bold transition-all duration-300 focus-ring
                  ${card.isFlipped || card.isMatched || showPreview
                    ? card.isMatched 
                      ? 'bg-gradient-to-br from-success to-success-light text-white scale-95 shadow-lg shadow-success/25'
                      : 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
                    : 'bg-gradient-to-br from-card to-card-secondary hover:from-hover hover:to-card border-2 border-card-border hover:border-primary/30'
                  }
                  ${!card.isFlipped && !card.isMatched && !showPreview ? 'hover:scale-105' : ''}
                  ${gameConfig.gridSize > 6 ? 'text-lg' : ''}
                `}
              >
                {card.isFlipped || card.isMatched || showPreview ? card.value : '?'}
              </button>
            ))}
          </div>
          
          {!gameStarted && !showPreview && (
            <div className="text-center mt-6">
              <p className="text-lg text-muted-foreground">Click any card to start Level {currentLevel}!</p>
              <p className="text-sm text-muted-foreground mt-2">
                AI has optimized this level for your {context?.userType?.replace('_', ' ')} playstyle
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Difficulty: {gameConfig.difficultyMultiplier.toFixed(2)}x • 
                Grid: {gameConfig.gridSize}x{gameConfig.gridSize} • 
                Time: {gameConfig.timeLimit}s
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryMatchingGame;
