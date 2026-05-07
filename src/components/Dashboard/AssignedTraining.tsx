import { useEffect, useState } from 'react';
import { ClipboardList, Play, Stethoscope, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMyTrainingPlans, type AssignedPlan } from '@/lib/patientTrainingPlans';

const AssignedTraining = () => {
  const [plans, setPlans] = useState<AssignedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      getMyTrainingPlans().then(p => {
        setPlans(p);
        setLoading(false);
      });
    };
    load();
    window.addEventListener('user-data-changed', load);
    window.addEventListener('focus', load);
    return () => {
      window.removeEventListener('user-data-changed', load);
      window.removeEventListener('focus', load);
    };
  }, []);

  const activePlans = plans.filter(p => p.status === 'active');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-primary" />
          Doctor-Assigned Training
        </CardTitle>
        <CardDescription>Games your doctor has prescribed for you</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : activePlans.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground">No active training plans yet.</p>
            <p className="text-sm text-muted-foreground">
              Your doctor will assign personalized games here.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'games' }))}>
              <Play className="h-4 w-4 mr-2" /> Browse all games
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activePlans.map(plan => (
              <div key={plan.id} className="space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {plan.doctorName && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Dr. {plan.doctorName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {plan.frequency}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{plan.games.length} games</Badge>
                </div>
                {plan.notes && (
                  <p className="text-sm text-muted-foreground italic">"{plan.notes}"</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.games.map(g => (
                    <div
                      key={g.id}
                      className="p-4 rounded-lg border border-border bg-background/40 hover:bg-hover transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{g.gameName}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{g.domain} · {g.difficulty}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {g.sessionsPerWeek}×/week
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('startGame', { detail: g.gameId }));
                        }}
                      >
                        <Play className="h-3 w-3 mr-2" /> Play now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignedTraining;