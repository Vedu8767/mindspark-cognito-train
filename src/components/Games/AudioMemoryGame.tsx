import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Volume2, Play, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  audioMemoryBandit, 
  AudioContext as AudioBanditContext, 
  AudioAction 
} from '@/lib/bandit/audioMemoryBandit';

interface AudioMemoryGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

const TONES = [
  { frequency: 220, name: 'Low', color: 'bg-red-500' },
  { frequency: 330, name: 'Mid-Low', color: 'bg-orange-500' },
  { frequency: 440, name: 'Mid', color: 'bg-blue-500' },
  { frequency: 550, name: 'Mid-High', color: 'bg-green-500' },
  { frequency: 660, name: 'High', color: 'bg-yellow-500' },
  { frequency: 770, name: 'Higher', color: 'bg-purple-500' },
  { frequency: 880, name: 'Highest', color: 'bg-pink-500' },
  { frequency: 990, name: 'Ultra', color: 'bg-indigo-500' },
];

const AudioMemoryGame = ({ onComplete, onExit }: AudioMemoryGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
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
  const [startTime, setStartTime] = useState<number>(0);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);

  // Bandit state
  const [currentConfig, setCurrentConfig] = useState<AudioAction | null>(null);
  const [recentAccuracy, setRecentAccuracy] = useState(0.7);
  const [recentSpeed, setRecentSpeed] = useState(0.7);
  const [streakCount, setStreakCount] = useState(0);
  const [frustrationLevel, setFrustrationLevel] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(1500);
  const [auditoryMemoryStrength, setAuditoryMemoryStrength] = useState(0.5);
  const [nextDifficultyPrediction, setNextDifficultyPrediction] = useState<'easier' | 'same' | 'harder'>('same');
  const [performanceInsight, setPerformanceInsight] = useState('');
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getUserType = (): 'speed_focused' | 'accuracy_focused' | 'balanced' => {
    if (recentSpeed > recentAccuracy + 0.15) return 'speed_focused';
    if (recentAccuracy > recentSpeed + 0.15) return 'accuracy_focused';
    return 'balanced';
  };

  const getContext = useCallback((): AudioBanditContext => {
    return {
      currentLevel,
      recentAccuracy,
      recentSpeed,
      sessionLength: Math.floor((Date.now() - startTime) / 60000),
      timeOfDay: getTimeOfDay(),
      previousDifficulty: currentConfig?.difficultyMultiplier || 1.0,
      streakCount,
      userType: getUserType(),
      avgResponseTime,
      frustrationLevel,
      engagementLevel: Math.max(0, 1 - frustrationLevel),
      preferredSequenceLength: currentConfig?.sequenceLength || 4,
      successRate: recentAccuracy,
      auditoryMemoryStrength
    };
  }, [currentLevel, recentAccuracy, recentSpeed, startTime, currentConfig, streakCount, avgResponseTime, frustrationLevel, auditoryMemoryStrength]);

  const activeTones = TONES.slice(0, currentConfig?.toneCount || 4);

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

  const generateSequence = useCallback(() => {
    if (!currentConfig) return;
    
    const toneCount = Math.min(currentConfig.toneCount, TONES.length);
    const newSequence = Array.from({ length: currentConfig.sequenceLength }, () => 
      Math.floor(Math.random() * toneCount)
    );
    setSequence(newSequence);
    setUserSequence([]);
    setGamePhase('listen');
  }, [currentConfig]);

  const initializeLevel = useCallback(() => {
    const context = getContext();
    const config = audioMemoryBandit.selectAction(context);
    setCurrentConfig(config);
    setCurrentTrial(0);
    setCorrect(0);
    setResponseTimes([]);
  }, [getContext]);

  useEffect(() => {
    if (gameStarted && currentConfig && !levelComplete && !gameComplete) {
      generateSequence();
    }
  }, [currentConfig, currentTrial]);

  useEffect(() => {
    if (gameStarted && !gameComplete && !levelComplete) {
      initializeLevel();
    }
  }, [currentLevel, gameStarted]);

  const playSequence = async () => {
    if (!currentConfig) return;
    
    setIsPlaying(true);
    const playbackDelay = Math.floor(600 / currentConfig.playbackSpeed);
    const toneDuration = Math.floor(400 / currentConfig.playbackSpeed);
    
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      playTone(TONES[sequence[i]].frequency, toneDuration);
      await new Promise(resolve => setTimeout(resolve, playbackDelay));
    }
    setIsPlaying(false);
    setGamePhase('repeat');
    setTrialStartTime(Date.now());
  };

  const handleToneClick = (toneIndex: number) => {
    if (gamePhase !== 'repeat' || isPlaying) return;
    
    const responseTime = Date.now() - (trialStartTime || Date.now());
    setResponseTimes(prev => [...prev, responseTime]);
    
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
      const points = 20 + (currentConfig?.sequenceLength || 4) * 5;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
      setStreakCount(prev => prev + 1);
      setFrustrationLevel(prev => Math.max(0, prev - 0.05));
      setAuditoryMemoryStrength(prev => Math.min(1, prev + 0.02));
    } else {
      setStreakCount(0);
      setFrustrationLevel(prev => Math.min(1, prev + 0.1));
      setAuditoryMemoryStrength(prev => Math.max(0, prev - 0.01));
    }

    setTimeout(() => {
      if (currentConfig && currentTrial + 1 >= currentConfig.trialCount) {
        handleLevelComplete();
      } else {
        setCurrentTrial(prev => prev + 1);
      }
    }, 1500);
  };

  const handleLevelComplete = () => {
    if (!currentConfig) return;
    
    setLevelComplete(true);
    
    const accuracy = correct / currentConfig.trialCount;
    const avgTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 2000;
    const timeEfficiency = Math.max(0, 1 - avgTime / 5000);
    
    const metrics = {
      completed: true,
      accuracy,
      timeEfficiency,
      correctTrials: correct,
      totalTrials: currentConfig.trialCount,
      avgResponseTime: avgTime
    };
    
    const reward = audioMemoryBandit.calculateReward(metrics);
    const context = getContext();
    
    audioMemoryBandit.updateModel(context, currentConfig, reward, metrics);
    
    // Update tracking
    setRecentAccuracy(prev => prev * 0.7 + accuracy * 0.3);
    setRecentSpeed(prev => prev * 0.7 + timeEfficiency * 0.3);
    setAvgResponseTime(prev => prev * 0.7 + avgTime * 0.3);
    
    // Bonus points
    const accuracyBonus = Math.floor(accuracy * 50);
    setScore(prev => prev + accuracyBonus);
    
    // Predict next difficulty
    const updatedContext = { ...context, recentAccuracy: recentAccuracy * 0.7 + accuracy * 0.3 };
    const prediction = audioMemoryBandit.predictNextDifficulty(updatedContext);
    const insight = audioMemoryBandit.getPerformanceInsight(updatedContext);
    setNextDifficultyPrediction(prediction);
    setPerformanceInsight(insight);
  };

  const advanceToNextLevel = () => {
    const context = getContext();
    const optimalLevel = audioMemoryBandit.getOptimalLevel(context);
    
    if (optimalLevel >= 25 || currentLevel >= 25) {
      setGameComplete(true);
      const finalScore = Math.min(100, Math.floor((score / 1000) * 100));
      onComplete(finalScore);
    } else {
      setCurrentLevel(optimalLevel);
      setLevelComplete(false);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
    setLevelComplete(false);
    setRecentAccuracy(0.7);
    setRecentSpeed(0.7);
    setStreakCount(0);
    setFrustrationLevel(0);
    setAvgResponseTime(1500);
    setAuditoryMemoryStrength(0.5);
  };

  const getDifficultyIcon = () => {
    switch (nextDifficultyPrediction) {
      case 'harder': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'easier': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-blue-500" />;
    }
  };

  const banditStats = audioMemoryBandit.getStats();

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <Trophy className="h-16 w-16 text-success mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Audio Expert!</h2>
            <p className="text-muted-foreground mb-4">Final Score: {score}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Skill Level: {banditStats.skillLevel}</p>
              <p>Levels Completed: {currentLevel}</p>
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

  if (levelComplete && currentConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-12 w-12 text-success" />
            <Badge variant="outline" className="bg-primary/10">
              <Brain className="h-3 w-3 mr-1" />
              AI Adaptive
            </Badge>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level Complete!</h2>
            <p className="text-muted-foreground mb-4">Score: {score}</p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-center gap-2">
                {getDifficultyIcon()}
                <span className="text-sm">
                  Next level will be <span className="font-semibold">{nextDifficultyPrediction}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground italic">{performanceInsight}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-muted-foreground">Accuracy</p>
              <p className="font-bold">{correct}/{currentConfig.trialCount} ({Math.round((correct / currentConfig.trialCount) * 100)}%)</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-muted-foreground">Sequence Length</p>
              <p className="font-bold">{currentConfig.sequenceLength} tones</p>
            </div>
          </div>
          <Button onClick={advanceToNextLevel} className="w-full btn-primary">
            Continue to Level {audioMemoryBandit.getOptimalLevel(getContext())}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Audio Memory - Level {currentLevel}</h1>
                <p className="text-muted-foreground">Listen and repeat the tone sequence!</p>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                <Brain className="h-3 w-3 mr-1" />
                AI Adaptive
              </Badge>
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
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">AI-Powered Adaptive Difficulty</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The game adjusts to your auditory memory across 25 levels
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground">Exploration Rate</p>
                  <p className="font-bold">{(banditStats.epsilon * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground">Skill Level</p>
                  <p className="font-bold">{banditStats.skillLevel}</p>
                </div>
              </div>
            </div>
            <Button onClick={startGame} className="btn-primary">
              <Volume2 className="h-4 w-4 mr-2" />
              Start Training
            </Button>
          </div>
        ) : currentConfig && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Trial</p>
                <p className="text-lg font-bold">{currentTrial + 1}/{currentConfig.trialCount}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Length</p>
                <p className="text-lg font-bold">{currentConfig.sequenceLength}</p>
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

            <div className="glass-card p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Tones: <span className="font-semibold text-foreground">{currentConfig.toneCount}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Streak: <span className="font-semibold text-success">{streakCount}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Speed: <span className="font-semibold">{currentConfig.playbackSpeed.toFixed(1)}x</span>
                  </span>
                </div>
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
                  {currentConfig.repeatAllowed && (
                    <p className="text-xs text-muted-foreground">You can replay the sequence in this mode</p>
                  )}
                </div>
              )}

              {gamePhase === 'repeat' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Repeat the sequence</h3>
                  <div className={`grid gap-4 max-w-md mx-auto ${
                    activeTones.length <= 4 ? 'grid-cols-2' : 
                    activeTones.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
                  }`}>
                    {activeTones.map((tone, index) => (
                      <Button
                        key={index}
                        onClick={() => handleToneClick(index)}
                        className={`h-16 text-white font-bold ${tone.color} hover:opacity-80 transition-all`}
                      >
                        {tone.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Progress: {userSequence.length}/{sequence.length}
                  </p>
                  {currentConfig.repeatAllowed && !isPlaying && (
                    <Button onClick={playSequence} variant="outline" size="sm">
                      <Play className="h-3 w-3 mr-1" />
                      Replay
                    </Button>
                  )}
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
