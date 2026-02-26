import { useState, useMemo } from 'react';
import { Trophy, Lock, Star, Flame, Gamepad2, Target, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getAchievements, TIER_COLORS, type Achievement } from '@/lib/achievements';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  streak: { label: 'Streaks', icon: Flame },
  mastery: { label: 'Mastery', icon: Star },
  exploration: { label: 'Exploration', icon: Gamepad2 },
  milestone: { label: 'Milestones', icon: Target },
  special: { label: 'Special', icon: Sparkles },
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const tier = TIER_COLORS[achievement.tier];
  const progress = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <Card className={`glass-card transition-all duration-300 ${achievement.unlocked ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-60'} border ${achievement.unlocked ? tier.border : 'border-border'}`}>
      <CardContent className="p-5">
        <div className="flex items-start space-x-4">
          <div className={`text-3xl p-3 rounded-xl ${achievement.unlocked ? tier.bg : 'bg-muted/30'} flex-shrink-0`}>
            {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-semibold text-sm truncate ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.title}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${tier.bg} ${tier.text}`}>
                {achievement.tier}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{achievement.progress}/{achievement.requirement}</span>
                {achievement.unlocked && achievement.unlockedAt && (
                  <span className="text-success text-xs">✅ {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                )}
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Achievements = () => {
  const achievements = useMemo(() => getAchievements(), []);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const tierCounts = useMemo(() => {
    const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    achievements.filter(a => a.unlocked).forEach(a => counts[a.tier]++);
    return counts;
  }, [achievements]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-accent to-accent-light rounded-xl">
            <Trophy className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Trophy Showcase</h1>
            <p className="text-lg text-muted-foreground">
              {unlockedCount}/{totalCount} achievements unlocked
            </p>
          </div>
        </div>

        {/* Tier Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {(['bronze', 'silver', 'gold', 'platinum'] as const).map(tier => {
            const colors = TIER_COLORS[tier];
            return (
              <div key={tier} className={`p-3 rounded-lg ${colors.bg} border ${colors.border} text-center`}>
                <p className={`text-2xl font-bold ${colors.text}`}>{tierCounts[tier]}</p>
                <p className="text-xs text-muted-foreground capitalize">{tier}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-fit">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0)).map(a => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </TabsContent>

        {Object.keys(CATEGORY_LABELS).map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.filter(a => a.category === cat).sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0)).map(a => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Achievements;
