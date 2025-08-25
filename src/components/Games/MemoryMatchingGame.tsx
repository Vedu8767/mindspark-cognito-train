import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const symbols = ['🧠', '🎯', '⚡', '🌟', '🎪', '🎨', '🎭', '🎪'];

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      endGame();
    }
  }, [timeLeft, gameStarted, gameComplete]);

  useEffect(() => {
    if (matches === symbols.length && !gameComplete) {
      endGame();
    }
  }, [matches, gameComplete]);

  const initializeGame = () => {
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
    setTimeLeft(120);
    setGameStarted(false);
    setGameComplete(false);
  };

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) setGameStarted(true);
    
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

      if (firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(matches + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const timeBonus = Math.max(0, timeLeft * 2);
    const moveEfficiency = Math.max(0, 100 - moves * 3);
    const matchBonus = matches * 10;
    const score = Math.min(100, timeBonus + moveEfficiency + matchBonus);
    setTimeout(() => onComplete(score), 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Well Done!</h2>
            <p className="text-muted-foreground">
              You completed the memory matching game with {matches} matches in {moves} moves!
            </p>
          </div>
          <div className="space-y-4">
            <Button onClick={initializeGame} variant="outline" className="w-full">
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
      <div className="container mx-auto max-w-4xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Memory Matching</h1>
              <p className="text-muted-foreground">Find all matching pairs!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Time Left</p>
            <p className="text-2xl font-bold text-foreground">{formatTime(timeLeft)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Moves</p>
            <p className="text-2xl font-bold text-foreground">{moves}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Matches</p>
            <p className="text-2xl font-bold text-foreground">{matches}/{symbols.length}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="glass-card p-6">
          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || flippedCards.length === 2}
                className={`
                  aspect-square rounded-lg text-3xl font-bold transition-all duration-300 focus-ring
                  ${card.isFlipped || card.isMatched
                    ? card.isMatched 
                      ? 'bg-gradient-to-br from-success to-success-light text-white scale-95'
                      : 'bg-gradient-to-br from-primary to-primary-dark text-white'
                    : 'bg-gradient-to-br from-card to-card-secondary hover:from-hover hover:to-card border-2 border-card-border hover:border-primary/30'
                  }
                  ${!card.isFlipped && !card.isMatched ? 'hover:scale-105' : ''}
                `}
              >
                {card.isFlipped || card.isMatched ? card.value : '?'}
              </button>
            ))}
          </div>
          
          {!gameStarted && (
            <div className="text-center mt-6">
              <p className="text-lg text-muted-foreground">Click any card to start!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryMatchingGame;