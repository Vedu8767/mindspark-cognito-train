import { Brain, Clock, TrendingUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameCardProps {
  title: string;
  description: string;
  domain: 'memory' | 'attention' | 'executive' | 'processing';
  lastScore?: number;
  improvement?: number;
  difficulty: string;
  estimatedTime: number;
  onPlay: () => void;
}

const GameCard = ({
  title,
  description,
  domain,
  lastScore,
  improvement,
  difficulty,
  estimatedTime,
  onPlay
}: GameCardProps) => {
  const domainColors = {
    memory: 'domain-memory',
    attention: 'domain-attention',
    executive: 'domain-executive',
    processing: 'domain-processing'
  };

  const domainLabels = {
    memory: 'Memory',
    attention: 'Attention',
    executive: 'Executive Function',
    processing: 'Processing Speed'
  };

  return (
    <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-all duration-300 animate-fade-in group">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${domainColors[domain]}`}>
              {domainLabels[domain]}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 py-3 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
            <Brain className="h-3 w-3" />
            <span>Score</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {lastScore ? `${lastScore}%` : '--'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" />
            <span>Progress</span>
          </div>
          <p className={`text-lg font-bold ${improvement && improvement > 0 ? 'text-success' : 'text-muted-foreground'}`}>
            {improvement ? `+${improvement}%` : '--'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>Time</span>
          </div>
          <p className="text-lg font-bold text-foreground">{estimatedTime}min</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Current Difficulty</p>
          <p className="text-sm font-medium text-foreground">{difficulty}</p>
        </div>
        
        <Button 
          onClick={onPlay}
          className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>Play Now</span>
        </Button>
      </div>
    </div>
  );
};

export default GameCard;