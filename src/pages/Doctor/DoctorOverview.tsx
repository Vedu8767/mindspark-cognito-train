import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Brain, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDoctorProfileId, fetchPatients, fetchAlerts, type PatientWithStats, type AlertRow } from '@/lib/doctorDataService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  onViewPatient: (id: string) => void;
  onNavigate: (page: string) => void;
}

const DoctorOverview = ({ onViewPatient, onNavigate }: Props) => {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const docId = await getDoctorProfileId();
      if (docId) {
        const [p, a] = await Promise.all([fetchPatients(docId), fetchAlerts(docId)]);
        setPatients(p);
        setAlerts(a);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const totalPatients = patients.length;
  const improving = patients.filter(p => p.recentTrend === 'improving').length;
  const declining = patients.filter(p => p.recentTrend === 'declining').length;
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const avgScore = totalPatients > 0 ? Math.round(patients.reduce((s, p) => s + p.overallScore, 0) / totalPatients) : 0;

  const patientScores = patients.map(p => ({
    name: p.name.split(' ').pop() || p.name,
    score: p.overallScore,
  }));

  const stats = [
    { label: 'Total Patients', value: totalPatients, icon: Users, color: 'from-primary to-primary-dark' },
    { label: 'Avg. Score', value: `${avgScore}%`, icon: Brain, color: 'from-[hsl(var(--success))] to-[hsl(var(--success-light))]' },
    { label: 'Improving', value: improving, icon: TrendingUp, color: 'from-[hsl(var(--success))] to-[hsl(var(--success-light))]' },
    { label: 'Needs Attention', value: declining, icon: AlertTriangle, color: 'from-[hsl(var(--destructive))] to-[hsl(0,65%,50%)]' },
  ];

  const recentAlerts = alerts.filter(a => !a.read).slice(0, 3);
  const atRiskPatients = patients.filter(p => p.riskLevel === 'high');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your patients and their cognitive health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                  <s.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {patientScores.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patientScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Alerts</CardTitle>
            {unreadAlerts > 0 && <Badge variant="destructive" className="text-[10px]">{unreadAlerts} new</Badge>}
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new alerts</p>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === 'high' ? 'text-destructive' : 'text-[hsl(var(--warning))]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.patientName}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => onNavigate('alerts')}>
              View all alerts <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">High-Risk Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRiskPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-risk patients</p>
            ) : (
              atRiskPatients.map(p => (
                <button key={p.id} onClick={() => onViewPatient(p.id)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-hover transition-colors text-left">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-destructive to-[hsl(0,65%,50%)] flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Score: {p.overallScore}% • {p.recentTrend}</p>
                  </div>
                  <Badge variant={p.recentTrend === 'declining' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                    {p.condition || 'N/A'}
                  </Badge>
                </button>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => onNavigate('patients')}>
              View all patients <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorOverview;
