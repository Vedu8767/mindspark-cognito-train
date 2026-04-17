import { ArrowRight, RotateCcw, Save, Trophy, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type DifficultyPrediction = 'easier' | 'same' | 'harder';

interface LevelCompleteScreenProps {
  level: number;
  maxLevel?: number;
  score: number;
  succeeded: boolean;
  /** Stat rows shown in a 3-col grid (e.g. {label:'Correct', value:'8/10'}) */
  stats?: Array<{ label: string; value: string | number; tone?: 'success' | 'accent' | 'primary' }>;
  /** AI bandit insight string, e.g. "92% accuracy → next will be harder" */
  insight?: string;
  /** Bandit's prediction for the next level. */
  prediction?: DifficultyPrediction;
  /** Whether the user can advance (e.g. not at max level and succeeded). */
  canAdvance?: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onSaveAndExit: () => void;
}

const toneClass = (tone?: string) => {
  switch (tone) {
    case 'success': return 'text-success';
    case 'accent': return 'text-accent';
    default: return 'text-primary';
  }
};

const predictionIcon = (p?: DifficultyPrediction) => {
  if (p === 'harder') return <TrendingUp className="h-4 w-4 text-orange-400" />;
  if (p === 'easier') return <TrendingDown className="h-4 w-4 text-green-400" />;
  return <Minus className="h-4 w-4 text-blue-400" />;
};

const predictionTint = (p?: DifficultyPrediction) => {
  if (p === 'harder') return 'from-orange-500/15 to-red-500/15 border-orange-500/30';
  if (p === 'easier') return 'from-green-500/15 to-emerald-500/15 border-green-500/30';
  return 'from-blue-500/15 to-cyan-500/15 border-blue-500/30';
};

const LevelCompleteScreen = ({
  level,
  maxLevel = 25,
  score,
  succeeded,
  stats = [],
  insight,
  prediction = 'same',
  canAdvance,
  onNextLevel,
  onReplay,
  onSaveAndExit,
}: LevelCompleteScreenProps) => {
  const advanceEnabled = canAdvance ?? (succeeded && level < maxLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
      <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
        <div className={`p-4 bg-gradient-to-br rounded-full w-20 h-20 mx-auto flex items-center justify-center ${
          succeeded ? 'from-success to-success-light' : 'from-muted to-muted-foreground'
        }`}>
          <Trophy className="h-10 w-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {succeeded ? `Level ${level} Complete!` : `Level ${level} — Try Again`}
          </h2>
          <p className="text-muted-foreground text-sm">Score: <span className="font-semibold text-foreground">{score}</span></p>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="bg-card/60 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${toneClass(s.tone)}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {insight && (
          <div className={`bg-gradient-to-r ${predictionTint(prediction)} p-4 rounded-lg border text-left`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">AI Coach</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight}</p>
            <div className="flex items-center gap-2">
              {predictionIcon(prediction)}
              <span className="text-sm text-muted-foreground">
                Next level prediction: <span className="font-semibold text-foreground capitalize">{prediction}</span>
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{level}/{maxLevel}</span>
          </div>
          <Progress value={(level / maxLevel) * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={onNextLevel}
            disabled={!advanceEnabled}
            className="w-full btn-primary"
            size="lg"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Continue to Level {Math.min(maxLevel, level + 1)}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onReplay} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Replay
            </Button>
            <Button onClick={onSaveAndExit} variant="secondary" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save &amp; Exit
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your progress is saved automatically. You can resume from Level {advanceEnabled ? level + 1 : level} next time.
        </p>
      </div>
    </div>
  );
};

export default LevelCompleteScreen;
