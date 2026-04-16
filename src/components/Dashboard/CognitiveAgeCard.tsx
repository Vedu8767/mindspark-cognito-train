import { Brain, TrendingUp, TrendingDown, Minus, ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { calculateCognitiveAge, type DomainPerformance } from '@/lib/cognitiveAge';
import { Progress } from '@/components/ui/progress';
import type { DomainScores } from '@/lib/patientDataService';

interface CognitiveAgeCardProps {
  domainScores?: DomainScores;
  sessionsCompleted?: number;
  chronologicalAge?: number;
  // Legacy props
  performance?: DomainPerformance;
}

const CognitiveAgeCard = ({ domainScores, sessionsCompleted = 0, chronologicalAge = 35, performance }: CognitiveAgeCardProps) => {
  const perf: DomainPerformance = performance || {
    memory: domainScores?.memory || 0,
    attention: domainScores?.attention || 0,
    executive: domainScores?.executive || 0,
    processing: domainScores?.processing || 0,
    reactionTime: 520,
    consistency: 0.75,
    sessionsCompleted,
  };

  const result = calculateCognitiveAge(perf, chronologicalAge);

  const ageColor = result.label === 'younger' ? 'text-success' :
    result.label === 'older' ? 'text-destructive' : 'text-foreground';

  const ageBg = result.label === 'younger' ? 'from-success/20 to-success/5' :
    result.label === 'older' ? 'from-destructive/20 to-destructive/5' : 'from-primary/20 to-primary/5';

  const TrendIcon = result.trend === 'improving' ? TrendingUp :
    result.trend === 'declining' ? TrendingDown : Minus;

  const trendColor = result.trend === 'improving' ? 'text-success' :
    result.trend === 'declining' ? 'text-destructive' : 'text-muted-foreground';

  const domains = [
    { name: 'Memory', age: result.domainAges.memory, score: perf.memory },
    { name: 'Attention', age: result.domainAges.attention, score: perf.attention },
    { name: 'Executive', age: result.domainAges.executive, score: perf.executive },
    { name: 'Processing', age: result.domainAges.processing, score: perf.processing },
  ];

  if (sessionsCompleted === 0 && !performance) {
    return (
      <Card className="glass-card-strong overflow-hidden">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Cognitive Age</h3>
          <p className="text-sm text-muted-foreground">Play some games to calculate your cognitive age!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card-strong overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${ageBg}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cognitive Age</h3>
              <p className="text-xs text-muted-foreground">AI-estimated brain age</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-xs font-medium capitalize">{result.trend}</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${ageBg}`}>
            <div className="text-center">
              <p className={`text-4xl font-bold ${ageColor}`}>{result.cognitiveAge}</p>
              <p className="text-xs text-muted-foreground">years</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              Chronological age: <span className="font-medium text-foreground">{chronologicalAge}</span>
            </p>
            <p className={`text-sm font-semibold ${ageColor} mt-1`}>
              {result.label === 'younger'
                ? `🎉 ${Math.abs(result.ageDifference)} years younger!`
                : result.label === 'older'
                ? `${result.ageDifference} years older`
                : '✨ Right on track!'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain Ages</p>
          {domains.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="text-sm text-foreground w-24">{d.name}</span>
              <div className="flex-1 mx-3">
                <Progress value={d.score} className="h-1.5" />
              </div>
              <span className={`text-sm font-medium ${d.age < chronologicalAge ? 'text-success' : d.age > chronologicalAge ? 'text-destructive' : 'text-foreground'}`}>
                {d.age}y
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-success/10 rounded-lg">
            <p className="text-xs font-medium text-success mb-1 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" /> Strengths
            </p>
            {result.strengths.map(s => (
              <p key={s} className="text-xs text-foreground">{s}</p>
            ))}
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-xs font-medium text-accent-foreground mb-1 flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" /> Focus Areas
            </p>
            {result.weaknesses.map(w => (
              <p key={w} className="text-xs text-foreground">{w}</p>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence: {Math.round(result.confidence * 100)}%</span>
          <span>{perf.sessionsCompleted} sessions analyzed</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CognitiveAgeCard;
