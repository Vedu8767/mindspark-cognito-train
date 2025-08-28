import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Home, Trophy, Volume2, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioMemoryGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const LEVELS = [
  { level: 1, sequenceLength: 4, trials: 6, timeLimit: 120 },
  { level: 2, sequenceLength: 5, trials: 8, timeLimit: 140 },
  { level: 3, sequenceLength: 6, trials: 10, timeLimit: 160 },
  { level: 4, sequenceLength: 7, trials: 12, timeLimit: 180 },
  { level: 5, sequenceLength: 8, trials: 14, timeLimit: 200 },
];

const TONES = [
  { frequency: 220, name: 'Low', color: 'bg-red-500' },
  { frequency: 330, name: 'Medium', color: 'bg-blue-500' },
  { frequency: 440, name: 'High', color: 'bg-green-500' },
  { frequency: 550, name: 'Higher', color: 'bg-yellow-500' },
];

const AudioMemoryGame = ({ onComplete, onExit }: AudioMemoryGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gamePhase, setGamePhase] = useState<'listen' | 'repeat'>('listen');

  const level = LEVELS[currentLevel];
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (currentLevel < LEVELS.length) {
      generateSequence();
    }
  }, [currentLevel]);

  const playTone = (frequency: number, duration: number = 500) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  const generateSequence = () => {
    const newSequence = Array.from({ length: level.sequenceLength }, () => 
      Math.floor(Math.random() * TONES.length)
    );
    setSequence(newSequence);
    setUserSequence([]);
    setGamePhase('listen');
  };

  const playSequence = async () => {
    setIsPlaying(true);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      playTone(TONES[sequence[i]].frequency);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    setIsPlaying(false);
    setGamePhase('repeat');
  };

  const handleToneClick = (toneIndex: number) => {
    if (gamePhase !== 'repeat' || isPlaying) return;
    
    playTone(TONES[toneIndex].frequency, 300);
    const newUserSequence = [...userSequence, toneIndex];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      setTimeout(() => checkAnswer(newUserSequence), 500);
    }
  };

  const checkAnswer = (userSeq: number[]) => {
    const isCorrect = userSeq.every((tone, index) => tone === sequence[index]);
    
    if (isCorrect) {
      const points = 20 + (level.sequenceLength * 5);
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTrial + 1 >= level.trials) {
        completeLevel();
      } else {
        setCurrentTrial(prev => prev + 1);
        generateSequence();
      }
    }, 1500);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    const accuracyBonus = Math.floor((correct / level.trials) * 50);
    setScore(prev => prev + accuracyBonus);
    
    setTimeout(() => {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
        setCurrentTrial(0);
        setCorrect(0);
      } else {
        setGameComplete(true);
        const finalScore = Math.min(100, Math.floor((score / 400) * 100));
        onComplete(finalScore);
      }
    }, 3000);
  };

  const startGame = () => {
    setGameStarted(true);
    generateSequence();
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
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <Trophy className="h-16 w-16 text-success mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Audio Expert!</h2>
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
      <div className="container mx-auto max-w-2xl">
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audio Memory - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Listen and repeat the tone sequence!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        {!gameStarted ? (
          <div className="glass-card p-8 text-center space-y-6">
            <Volume2 className="h-24 w-24 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Audio Memory</h2>
              <p className="text-muted-foreground mb-6">Listen to tone sequences and repeat them back</p>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Volume2 className="h-4 w-4 mr-2" />
              Start Training
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Trial</p>
                <p className="text-lg font-bold">{currentTrial + 1}/{level.trials}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Length</p>
                <p className="text-lg font-bold">{level.sequenceLength}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-bold">{score}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-lg font-bold text-success">{correct}</p>
              </div>
            </div>

            <div className="glass-card p-8 text-center space-y-6">
              {gamePhase === 'listen' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Listen to the sequence</h3>
                  <Button onClick={playSequence} disabled={isPlaying} className="btn-primary">
                    <Play className="h-4 w-4 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play Sequence'}
                  </Button>
                </div>
              )}

              {gamePhase === 'repeat' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Repeat the sequence</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    {TONES.map((tone, index) => (
                      <Button
                        key={index}
                        onClick={() => handleToneClick(index)}
                        className={`h-20 text-white font-bold ${tone.color} hover:opacity-80`}
                      >
                        {tone.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Progress: {userSequence.length}/{sequence.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioMemoryGame;