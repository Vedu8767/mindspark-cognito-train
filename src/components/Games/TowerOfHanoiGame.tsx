import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TowerOfHanoiGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const LEVELS = [
  { level: 1, disks: 3, timeLimit: 120 },
  { level: 2, disks: 4, timeLimit: 180 },
  { level: 3, disks: 5, timeLimit: 240 },
  { level: 4, disks: 6, timeLimit: 300 },
  { level: 5, disks: 7, timeLimit: 360 },
];

const TowerOfHanoiGame = ({ onComplete, onExit }: TowerOfHanoiGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [towers, setTowers] = useState<number[][]>([[], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const level = LEVELS[currentLevel];
  const minMoves = Math.pow(2, level.disks) - 1;

  useEffect(() => {
    initializeLevel();
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const initializeLevel = () => {
    const initialTower = Array.from({ length: level.disks }, (_, i) => level.disks - i);
    setTowers([initialTower, [], []]);
    setMoves(0);
    setSelectedTower(null);
    setTimeLeft(level.timeLimit);
    setLevelComplete(false);
  };

  const handleTowerClick = (towerIndex: number) => {
    if (selectedTower === null) {
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else {
      if (selectedTower === towerIndex) {
        setSelectedTower(null);
      } else {
        moveDisk(selectedTower, towerIndex);
        setSelectedTower(null);
      }
    }
  };

  const moveDisk = (fromTower: number, toTower: number) => {
    const newTowers = towers.map(tower => [...tower]);
    const disk = newTowers[fromTower].pop();
    
    if (disk && (newTowers[toTower].length === 0 || disk < newTowers[toTower][newTowers[toTower].length - 1])) {
      newTowers[toTower].push(disk);
      setTowers(newTowers);
      setMoves(prev => prev + 1);
      
      // Check win condition
      if (newTowers[2].length === level.disks) {
        setTimeout(() => completeLevel(), 500);
      }
    }
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    const efficiencyBonus = Math.max(0, Math.floor((minMoves / Math.max(moves, minMoves)) * 100));
    const timeBonus = Math.floor(timeLeft * 2);
    const levelPoints = level.disks * 20;
    const totalPoints = levelPoints + efficiencyBonus + timeBonus;
    
    setScore(prev => prev + totalPoints);
    
    setTimeout(() => {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
      } else {
        setGameComplete(true);
        const finalScore = Math.min(100, Math.floor((score / 500) * 100));
        onComplete(finalScore);
      }
    }, 3000);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  const renderDisk = (size: number) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    const width = `${size * 20 + 40}px`;
    
    return (
      <div
        className={`h-8 ${colors[size - 1]} rounded-lg mx-auto mb-1 flex items-center justify-center text-white font-bold`}
        style={{ width }}
      >
        {size}
      </div>
    );
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <Trophy className="h-16 w-16 text-success mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Master!</h2>
            <p className="text-muted-foreground mb-4">Final Score: {score}</p>
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
      <div className="container mx-auto max-w-4xl">
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tower of Hanoi - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Move all disks to the rightmost tower!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        {!gameStarted ? (
          <div className="glass-card p-8 text-center space-y-6">
            <Puzzle className="h-24 w-24 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Tower of Hanoi</h2>
              <p className="text-muted-foreground mb-6">
                Move all disks to the right tower. Only smaller disks can go on top of larger ones.
              </p>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-semibold">Level {currentLevel + 1}: {level.disks} disks</p>
                <p className="text-xs text-muted-foreground">Minimum moves: {minMoves}</p>
              </div>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Puzzle className="h-4 w-4 mr-2" />
              Start Puzzle
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-lg font-bold">{timeLeft}s</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Moves</p>
                <p className="text-lg font-bold">{moves}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Min Moves</p>
                <p className="text-lg font-bold">{minMoves}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-bold">{score}</p>
              </div>
            </div>

            <div className="glass-card p-8">
              <div className="grid grid-cols-3 gap-8">
                {towers.map((tower, towerIndex) => (
                  <div
                    key={towerIndex}
                    onClick={() => handleTowerClick(towerIndex)}
                    className={`cursor-pointer p-4 min-h-64 border-2 border-dashed rounded-lg transition-all ${
                      selectedTower === towerIndex 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col-reverse justify-start items-center h-full">
                      <div className="w-full h-4 bg-border rounded mb-2"></div>
                      {tower.map((disk, diskIndex) => (
                        <div key={diskIndex}>
                          {renderDisk(disk)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerOfHanoiGame;