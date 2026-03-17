import { ArrowLeft, Brain, Calendar, TrendingUp, TrendingDown, Minus, Activity, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockPatients, mockTrainingPlans, mockAlerts } from '@/lib/mockDoctorData';

interface Props {
  patientId: string;
  onBack: () => void;
}

const PatientProfile = ({ patientId, onBack }: Props) => {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) return <div className="text-center py-12 text-muted-foreground">Patient not found.</div>;

  const plan = mockTrainingPlans.find(p => p.patientId === patientId);
  const alerts = mockAlerts.filter(a => a.patientId === patientId);

  const ageDiff = patient.cognitiveAge - patient.age;
  const ageLabel = ageDiff <= -3 ? 'younger' : ageDiff >= 3 ? 'older' : 'age-appropriate';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
            <Badge variant="outline">{patient.condition}</Badge>
            <Badge variant={patient.riskLevel === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{patient.riskLevel} risk</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Age {patient.age} • Enrolled {new Date(patient.enrolledDate).toLocaleDateString()} • {patient.email}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Overall Score', value: `${patient.overallScore}%`, icon: Brain, gradient: 'from-primary to-primary-dark' },
          { label: 'Cognitive Age', value: `${patient.cognitiveAge}`, icon: Activity, gradient: ageDiff < 0 ? 'from-[hsl(var(--success))] to-[hsl(var(--success-light))]' : 'from-[hsl(var(--accent))] to-[hsl(var(--accent-light))]' },
          { label: 'Streak', value: `${patient.currentStreak} days`, icon: Flame, gradient: 'from-[hsl(var(--accent))] to-[hsl(var(--accent-light))]' },
          { label: 'Sessions', value: `${patient.totalSessions}`, icon: Target, gradient: 'from-[hsl(var(--secondary))] to-[hsl(var(--secondary-light))]' },
          { label: 'Trend', value: patient.recentTrend, icon: patient.recentTrend === 'improving' ? TrendingUp : patient.recentTrend === 'declining' ? TrendingDown : Minus, gradient: patient.recentTrend === 'improving' ? 'from-[hsl(var(--success))] to-[hsl(var(--success-light))]' : 'from-[hsl(var(--destructive))] to-[hsl(0,65%,50%)]' },
        ].map(m => (
          <Card key={m.label} className="border-border">
            <CardContent className="p-4">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${m.gradient} w-fit mb-2`}>
                <m.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground capitalize">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cognitive Age Interpretation */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cognitive Age Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {patient.name}'s cognitive age is <strong>{patient.cognitiveAge}</strong> compared to chronological age <strong>{patient.age}</strong>.
            Brain is performing <strong>{ageLabel}</strong> than expected ({Math.abs(ageDiff)} year{Math.abs(ageDiff) !== 1 ? 's' : ''} {ageDiff < 0 ? 'younger' : 'older'}).
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(['memory', 'attention', 'executive', 'processing'] as const).map(d => (
              <div key={d}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="capitalize text-foreground font-medium">{d}</span>
                  <span className="text-foreground font-bold">{patient.domainScores[d]}%</span>
                </div>
                <Progress value={patient.domainScores[d]} className="h-2.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Training Plan */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assigned Training Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{plan.name}</p>
                  <Badge variant="outline" className="text-[10px]">{plan.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{plan.frequency} • Started {new Date(plan.startDate).toLocaleDateString()}</p>
                {plan.notes && <p className="text-xs text-muted-foreground italic">"{plan.notes}"</p>}
                <div className="space-y-2 mt-3">
                  {plan.games.map(g => (
                    <div key={g.gameId} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                      <span className="font-medium text-foreground">{g.gameName}</span>
                      <span className="text-muted-foreground">{g.difficulty} • {g.sessionsPerWeek}x/wk</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No training plan assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Patient Alerts */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts for this patient.</p>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`p-3 rounded-lg text-xs ${a.read ? 'bg-muted/30' : 'bg-muted/60 border border-border'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{a.type.replace('_', ' ')}</Badge>
                    <span className="text-muted-foreground">{new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground">{a.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfile;
