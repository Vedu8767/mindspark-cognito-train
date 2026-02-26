import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Layout/Header';
import Dashboard from '@/pages/Dashboard';
import Games from '@/pages/Games';
import Analytics from '@/pages/Analytics';
import Articles from '@/pages/Articles';
import AIInsightsDashboard from '@/pages/AIInsightsDashboard';
import DailyChallengePage from '@/pages/DailyChallengePage';
import Achievements from '@/pages/Achievements';
import GameHistoryPage from '@/pages/GameHistory';
import AchievementToast from '@/components/AchievementToast';
import MemoryMatchingGame from '@/components/Games/MemoryMatchingGame';
import { checkGameAchievements, addGameHistory, type Achievement } from '@/lib/achievements';
import { soundManager } from '@/lib/soundManager';

const AppLayout = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    const handleStartGame = (event: any) => {
      setCurrentGame(event.detail);
    };

    window.addEventListener('startGame', handleStartGame);
    return () => window.removeEventListener('startGame', handleStartGame);
  }, []);

  const GAME_META: Record<string, { name: string; domain: string }> = {
    'memory-matching': { name: 'Memory Matching', domain: 'memory' },
    'attention-focus': { name: 'Attention Focus', domain: 'attention' },
    'reaction-speed': { name: 'Reaction Speed', domain: 'processing' },
    'pattern-recognition': { name: 'Pattern Recognition', domain: 'executive' },
    'word-memory': { name: 'Word Memory', domain: 'memory' },
    'math-challenge': { name: 'Math Challenge', domain: 'executive' },
    'visual-processing': { name: 'Visual Processing', domain: 'processing' },
    'executive-function': { name: 'Executive Function', domain: 'executive' },
    'spatial-navigation': { name: 'Spatial Navigation', domain: 'memory' },
    'processing-speed': { name: 'Processing Speed', domain: 'processing' },
    'audio-memory': { name: 'Audio Memory', domain: 'memory' },
    'tower-of-hanoi': { name: 'Tower of Hanoi', domain: 'executive' },
    'tower-hanoi': { name: 'Tower of Hanoi', domain: 'executive' },
  };

  const handleGameComplete = (score: number) => {
    const gameId = currentGame || '';
    const meta = GAME_META[gameId] || { name: gameId, domain: 'memory' };

    // Record history
    addGameHistory({
      gameId,
      gameName: meta.name,
      score,
      level: 1,
      duration: 60,
      completed: true,
      domain: meta.domain,
      difficulty: 'Adaptive',
    });

    // Check achievements
    const newlyUnlocked = checkGameAchievements({
      gameId,
      score,
      level: 1,
      duration: 60,
      completed: true,
    });

    if (newlyUnlocked.length > 0) {
      soundManager.achievement();
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    } else {
      soundManager.victory();
    }

    console.log(`Game completed with score: ${score}`);
    setCurrentGame(null);
    setCurrentPage('games');
  };

  const handleGameExit = () => {
    setCurrentGame(null);
    setCurrentPage('games');
  };

  // Game loading component
  const GameLoader = () => (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    </div>
  );

  // If playing a game, show the game component
  if (currentGame === 'memory-matching') {
    return (
      <MemoryMatchingGame 
        onComplete={handleGameComplete}
        onExit={handleGameExit}
      />
    );
  }

  if (currentGame === 'attention-focus') {
    const AttentionFocusGame = lazy(() => import('@/components/Games/AttentionFocusGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <AttentionFocusGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'reaction-speed') {
    const ReactionSpeedGame = lazy(() => import('@/components/Games/ReactionSpeedGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <ReactionSpeedGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'pattern-recognition') {
    const PatternRecognitionGame = lazy(() => import('@/components/Games/PatternRecognitionGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <PatternRecognitionGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'word-memory') {
    const WordMemoryGame = lazy(() => import('@/components/Games/WordMemoryGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <WordMemoryGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'math-challenge') {
    const MathChallengeGame = lazy(() => import('@/components/Games/MathChallengeGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <MathChallengeGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'visual-processing') {
    const VisualProcessingGame = lazy(() => import('@/components/Games/VisualProcessingGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <VisualProcessingGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'executive-function') {
    const ExecutiveFunctionGame = lazy(() => import('@/components/Games/ExecutiveFunctionGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <ExecutiveFunctionGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'spatial-navigation') {
    const SpatialNavigationGame = lazy(() => import('@/components/Games/SpatialNavigationGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <SpatialNavigationGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'processing-speed') {
    const ProcessingSpeedGame = lazy(() => import('@/components/Games/ProcessingSpeedGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <ProcessingSpeedGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'audio-memory') {
    const AudioMemoryGame = lazy(() => import('@/components/Games/AudioMemoryGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <AudioMemoryGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  if (currentGame === 'tower-of-hanoi') {
    const TowerOfHanoiGame = lazy(() => import('@/components/Games/TowerOfHanoiGame'));
    return (
      <Suspense fallback={<GameLoader />}>
        <TowerOfHanoiGame 
          onComplete={handleGameComplete}
          onExit={handleGameExit}
        />
      </Suspense>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'games':
        return <Games />;
      case 'daily-challenge':
        return <DailyChallengePage />;
      case 'ai-dashboard':
        return <AIInsightsDashboard />;
      case 'achievements':
        return <Achievements />;
      case 'history':
        return <GameHistoryPage />;
      case 'analytics':
        return <Analytics />;
      case 'articles':
        return <Articles />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {renderPage()}
      </main>

      {/* Achievement Toasts */}
      {achievementQueue.length > 0 && (
        <AchievementToast
          achievement={achievementQueue[0]}
          onDismiss={() => setAchievementQueue(prev => prev.slice(1))}
        />
      )}
    </div>
  );
};

export default AppLayout;