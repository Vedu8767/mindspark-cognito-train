import { useState, useEffect } from 'react';
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

  // If playing a game, show the game component
  if (currentGame === 'memory-matching') {
    return (
      <MemoryMatchingGame 
        onComplete={handleGameComplete}
        onExit={handleGameExit}
      />
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