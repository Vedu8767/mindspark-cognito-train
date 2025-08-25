import { Brain, Eye, Zap, Target, Volume2, Calculator, Puzzle, Navigation } from 'lucide-react';
import GameCard from '@/components/Games/GameCard';

const Games = () => {
  const games = [
    {
      id: 'memory-matching',
      title: 'Memory Matching',
      description: 'Flip cards to find matching pairs. Strengthens working memory and visual recognition skills.',
      domain: 'memory' as const,
      icon: Brain,
      lastScore: 87,
      improvement: 12,
      difficulty: 'Adaptive Medium',
      estimatedTime: 5,
    },
    {
      id: 'attention-focus',
      title: 'Attention Focus',
      description: 'Tap target objects among distractors. Improves selective attention and focus control.',
      domain: 'attention' as const,
      icon: Target,
      lastScore: 89,
      improvement: 15,
      difficulty: 'Adaptive Hard',
      estimatedTime: 4,
    },
    {
      id: 'reaction-speed',
      title: 'Reaction Speed',
      description: 'Quick responses to visual stimuli. Enhances processing speed and motor responses.',
      domain: 'processing' as const,
      icon: Zap,
      lastScore: 78,
      improvement: 8,
      difficulty: 'Adaptive Medium',
      estimatedTime: 3,
    },
    {
      id: 'pattern-recognition',
      title: 'Pattern Recognition',
      description: 'Identify patterns in sequences. Develops logical reasoning and pattern detection skills.',
      domain: 'executive' as const,
      icon: Puzzle,
      lastScore: 82,
      improvement: 10,
      difficulty: 'Adaptive Medium',
      estimatedTime: 6,
    },
    {
      id: 'word-memory',
      title: 'Word Memory',
      description: 'Remember and recall word lists. Strengthens verbal memory and language processing.',
      domain: 'memory' as const,
      icon: Brain,
      lastScore: 85,
      improvement: 7,
      difficulty: 'Adaptive Easy',
      estimatedTime: 5,
    },
    {
      id: 'math-challenge',
      title: 'Math Challenge',
      description: 'Solve mathematical problems quickly. Enhances numerical processing and mental math skills.',
      domain: 'executive' as const,
      icon: Calculator,
      lastScore: 76,
      improvement: 14,
      difficulty: 'Adaptive Medium',
      estimatedTime: 7,
    },
    {
      id: 'visual-processing',
      title: 'Visual Processing',
      description: 'Match and identify visual patterns. Improves visual-spatial processing abilities.',
      domain: 'processing' as const,
      icon: Eye,
      lastScore: 91,
      improvement: 6,
      difficulty: 'Adaptive Hard',
      estimatedTime: 4,
    },
    {
      id: 'executive-function',
      title: 'Executive Function',
      description: 'Multi-step task management. Develops planning, working memory, and cognitive flexibility.',
      domain: 'executive' as const,
      icon: Target,
      lastScore: 73,
      improvement: 11,
      difficulty: 'Adaptive Medium',
      estimatedTime: 8,
    },
    {
      id: 'spatial-navigation',
      title: 'Spatial Navigation',
      description: 'Navigate through virtual environments. Strengthens spatial memory and orientation skills.',
      domain: 'memory' as const,
      icon: Navigation,
      lastScore: 80,
      improvement: 9,
      difficulty: 'Adaptive Medium',
      estimatedTime: 6,
    },
    {
      id: 'processing-speed',
      title: 'Processing Speed',
      description: 'Rapid symbol matching tasks. Improves cognitive processing speed and accuracy.',
      domain: 'processing' as const,
      icon: Zap,
      lastScore: 84,
      improvement: 13,
      difficulty: 'Adaptive Medium',
      estimatedTime: 3,
    },
    {
      id: 'audio-memory',
      title: 'Audio Memory',
      description: 'Listen and recall sound sequences. Develops auditory memory and sequence recognition.',
      domain: 'memory' as const,
      icon: Volume2,
      lastScore: 79,
      improvement: 5,
      difficulty: 'Adaptive Easy',
      estimatedTime: 5,
    },
    {
      id: 'tower-hanoi',
      title: 'Tower of Hanoi',
      description: 'Classic strategy puzzle game. Enhances problem-solving and planning abilities.',
      domain: 'executive' as const,
      icon: Puzzle,
      lastScore: 88,
      improvement: 16,
      difficulty: 'Adaptive Hard',
      estimatedTime: 10,
    },
  ];

  const handlePlayGame = (gameId: string) => {
    if (gameId === 'memory-matching') {
      // This will be handled by the parent component
      window.dispatchEvent(new CustomEvent('startGame', { detail: gameId }));
    } else {
      console.log(`Starting game: ${gameId} (not implemented yet)`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Brain Training Games</h1>
            <p className="text-lg text-muted-foreground">
              Personalized cognitive exercises powered by AI for optimal challenge and progress
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-cognitive-memory"></div>
              <span className="text-sm font-medium">Memory Games</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-cognitive-attention"></div>
              <span className="text-sm font-medium">Attention Training</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-cognitive-executive"></div>
              <span className="text-sm font-medium">Executive Function</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-cognitive-processing"></div>
              <span className="text-sm font-medium">Processing Speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Status Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">🤖 AI Personalization Active</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is continuously adapting game difficulty based on your performance for optimal cognitive training.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-success">Status: Active</p>
            <p className="text-xs text-muted-foreground">Last update: Just now</p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, index) => (
          <div key={game.id} style={{ animationDelay: `${index * 100}ms` }}>
            <GameCard
              title={game.title}
              description={game.description}
              domain={game.domain}
              lastScore={game.lastScore}
              improvement={game.improvement}
              difficulty={game.difficulty}
              estimatedTime={game.estimatedTime}
              onPlay={() => handlePlayGame(game.id)}
            />
          </div>
        ))}
      </div>

      {/* Recommendation Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">🎯 AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-accent/10 to-accent-light/10 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Today's Optimal Challenge</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your recent performance, try Attention Focus for the best cognitive workout.
            </p>
            <button className="text-sm text-accent font-medium hover:text-accent-light transition-colors">
              Start Recommended Session →
            </button>
          </div>
          <div className="p-4 bg-gradient-to-r from-success/10 to-success-light/10 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Skill Building Opportunity</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your executive function shows room for growth. Tower of Hanoi could help strengthen this area.
            </p>
            <button className="text-sm text-success font-medium hover:text-success-light transition-colors">
              Try Skill Builder →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;