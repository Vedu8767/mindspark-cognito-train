import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Layout/Header';
import Dashboard from '@/pages/Dashboard';
import Games from '@/pages/Games';
import Analytics from '@/pages/Analytics';
import Articles from '@/pages/Articles';
import MemoryMatchingGame from '@/components/Games/MemoryMatchingGame';

const AppLayout = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  useEffect(() => {
    const handleStartGame = (event: any) => {
      setCurrentGame(event.detail);
    };

    window.addEventListener('startGame', handleStartGame);
    return () => window.removeEventListener('startGame', handleStartGame);
  }, []);

  const handleGameComplete = (score: number) => {
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
    </div>
  );
};

export default AppLayout;