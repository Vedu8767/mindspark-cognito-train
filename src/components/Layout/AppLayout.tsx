import { useState, useEffect, lazy, Suspense, ComponentType } from 'react';
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
import { checkGameAchievements, addGameHistory, type Achievement } from '@/lib/achievements';
import { soundManager } from '@/lib/soundManager';

/** Payload each game sends back when the user explicitly chooses Save & Exit. */
export interface GameCompletionPayload {
  score: number;
  level: number;
  duration: number; // seconds played in this session
  completed: boolean;
  difficulty?: string;
  accuracy?: number;
  reactionTime?: number;
  moves?: number;
}

type GameComponentProps = {
  onComplete: (payload: GameCompletionPayload | number) => void;
  onExit: () => void;
};

// Lazy-loaded game components at module scope
const LAZY_GAMES: Record<string, ComponentType<GameComponentProps>> = {
  'memory-matching': lazy(() => import('@/components/Games/MemoryMatchingGame')),
  'attention-focus': lazy(() => import('@/components/Games/AttentionFocusGame')),
  'reaction-speed': lazy(() => import('@/components/Games/ReactionSpeedGame')),
  'pattern-recognition': lazy(() => import('@/components/Games/PatternRecognitionGame')),
  'word-memory': lazy(() => import('@/components/Games/WordMemoryGame')),
  'math-challenge': lazy(() => import('@/components/Games/MathChallengeGame')),
  'visual-processing': lazy(() => import('@/components/Games/VisualProcessingGame')),
  'executive-function': lazy(() => import('@/components/Games/ExecutiveFunctionGame')),
  'spatial-navigation': lazy(() => import('@/components/Games/SpatialNavigationGame')),
  'processing-speed': lazy(() => import('@/components/Games/ProcessingSpeedGame')),
  'audio-memory': lazy(() => import('@/components/Games/AudioMemoryGame')),
  'tower-of-hanoi': lazy(() => import('@/components/Games/TowerOfHanoiGame')),
};

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
};

const GameLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading game...</p>
    </div>
  </div>
);

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

  const handleGameComplete = (payload: GameCompletionPayload | number) => {
    const gameId = currentGame || '';
    const meta = GAME_META[gameId] || { name: gameId, domain: 'memory' };

    // Backwards-compat: some games still call onComplete(score). Normalize.
    const data: GameCompletionPayload =
      typeof payload === 'number'
        ? { score: payload, level: 1, duration: 0, completed: true, difficulty: 'Adaptive' }
        : { difficulty: 'Adaptive', ...payload };

    addGameHistory({
      gameId,
      gameName: meta.name,
      score: data.score,
      level: data.level,
      duration: data.duration,
      completed: data.completed,
      domain: meta.domain,
      difficulty: data.difficulty || 'Adaptive',
    });

    const newlyUnlocked = checkGameAchievements({
      gameId,
      score: data.score,
      level: data.level,
      duration: data.duration,
      completed: data.completed,
    });

    if (newlyUnlocked.length > 0) {
      soundManager.achievement();
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    } else {
      soundManager.victory();
    }

    console.log(`[AppLayout] ${gameId} completed`, data);
    // Notify pages that user data has changed so they can refresh from DB.
    window.dispatchEvent(new CustomEvent('user-data-changed', { detail: { gameId } }));
    setCurrentGame(null);
    setCurrentPage('games');
  };

  const handleGameExit = () => {
    setCurrentGame(null);
    setCurrentPage('games');
  };

  // Render active game via map lookup
  if (currentGame) {
    const GameComponent = LAZY_GAMES[currentGame];
    if (GameComponent) {
      return (
        <Suspense fallback={<GameLoader />}>
          <GameComponent onComplete={handleGameComplete} onExit={handleGameExit} />
        </Suspense>
      );
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'games': return <Games />;
      case 'daily-challenge': return <DailyChallengePage />;
      case 'ai-dashboard': return <AIInsightsDashboard />;
      case 'achievements': return <Achievements />;
      case 'history': return <GameHistoryPage />;
      case 'analytics': return <Analytics />;
      case 'articles': return <Articles />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {renderPage()}
      </main>
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