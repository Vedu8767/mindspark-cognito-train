import { useState, useEffect } from 'react';
import { Flame, Trophy, Star, Clock, Target, Zap, Gift, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDailyChallenge, getStreakData, completeChallenge, type DailyChallenge, type ChallengeStreak } from '@/lib/dailyChallenge';

const DailyChallengePage = () => {
  const [challenge, setChallenge] = useState<DailyChallenge>(getDailyChallenge());
  const [streak, setStreak] = useState<ChallengeStreak>(getStreakData());
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartChallenge = () => {
    window.dispatchEvent(new CustomEvent('startGame', { detail: challenge.gameId }));
  };

  const handleSimulateComplete = () => {
    const score = Math.floor(Math.random() * 30) + 70;
    const updatedStreak = completeChallenge(score);
    setStreak(updatedStreak);
    setChallenge(prev => ({ ...prev, completed: true, score }));
  };

  const domainColors: Record<string, string> = {
    memory: 'from-cognitive-memory to-cognitive-memory/70',
    attention: 'from-cognitive-attention to-cognitive-attention/70',
    executive: 'from-cognitive-executive to-cognitive-executive/70',
    processing: 'from-cognitive-processing to-cognitive-processing/70',
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-success/10 text-success',
    medium: 'bg-accent/10 text-accent-foreground',
    hard: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-accent to-accent-light rounded-xl">
              <Target className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Daily Challenge</h1>
              <p className="text-lg text-muted-foreground">Complete today's curated challenge to build your streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next challenge in</p>
            <p className="text-2xl font-mono font-bold text-foreground">{timeLeft}</p>
          </div>
        </div>
      </div>

      {/* Streak Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-success/10 rounded-xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Flame className="h-7 w-7 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-3xl font-bold text-foreground">{streak.current}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-accent/10 rounded-xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-3xl font-bold text-foreground">{streak.longest}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-primary/10 rounded-xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <p className="text-3xl font-bold text-foreground">{streak.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">challenges</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Challenge */}
      <Card className={`glass-card-strong overflow-hidden ${challenge.completed ? 'ring-2 ring-success' : ''}`}>
        <div className={`h-2 bg-gradient-to-r ${domainColors[challenge.domain]}`} />
        <CardContent className="p-8">
          {challenge.completed ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-success/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Challenge Completed!</h2>
              <p className="text-lg text-muted-foreground">Score: <span className="text-success font-bold">{challenge.score}%</span></p>
              <div className="flex items-center justify-center space-x-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">XP Earned</p>
                  <p className="text-lg font-bold text-foreground">{challenge.xpReward}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Streak Bonus</p>
                  <p className="text-lg font-bold text-success">+{Math.min(streak.current * 10, 100)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Come back tomorrow for a new challenge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-foreground">{challenge.gameName}</h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${difficultyColors[challenge.difficulty]}`}>
                    {challenge.difficulty.toUpperCase()}
                  </span>
                </div>
                <p className="text-muted-foreground capitalize">Domain: {challenge.domain}</p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Target Score</p>
                      <p className="text-xs text-muted-foreground">Score at least {challenge.targetScore}% to complete</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <Star className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Bonus Objective</p>
                      <p className="text-xs text-muted-foreground">{challenge.bonusObjective}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <Gift className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Rewards</p>
                      <p className="text-xs text-muted-foreground">{challenge.xpReward} XP + streak bonus</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <Zap className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
                <Button 
                  onClick={handleStartChallenge}
                  className="btn-primary text-lg px-8 py-4 h-auto"
                >
                  Start Challenge <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <button
                  onClick={handleSimulateComplete}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  (Demo: Simulate completion)
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Rewards */}
      <Card className="glass-card p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg flex items-center">
            <Gift className="h-5 w-5 mr-2 text-accent" />
            Streak Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {streak.rewards.map((reward) => (
              <div
                key={reward.streakRequired}
                className={`p-3 rounded-xl text-center transition-all ${
                  reward.unlocked
                    ? 'bg-success/10 border border-success/30'
                    : streak.current >= reward.streakRequired * 0.5
                    ? 'bg-accent/5 border border-accent/20'
                    : 'bg-muted/20 border border-transparent opacity-60'
                }`}
              >
                <p className="text-2xl mb-1">{reward.icon}</p>
                <p className="text-xs font-medium text-foreground">{reward.name}</p>
                <p className="text-xs text-muted-foreground">{reward.streakRequired} days</p>
                {reward.unlocked && (
                  <CheckCircle2 className="h-3 w-3 text-success mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
          {streak.current > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Next reward progress</span>
                <span>
                  {(() => {
                    const nextReward = streak.rewards.find(r => !r.unlocked);
                    return nextReward ? `${streak.current}/${nextReward.streakRequired} days` : 'All unlocked!';
                  })()}
                </span>
              </div>
              <Progress
                value={(() => {
                  const nextReward = streak.rewards.find(r => !r.unlocked);
                  return nextReward ? (streak.current / nextReward.streakRequired) * 100 : 100;
                })()}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyChallengePage;
