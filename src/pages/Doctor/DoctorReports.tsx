import { Brain, TrendingUp, TrendingDown, Users, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { mockPatients, generateCohortTrend } from '@/lib/mockDoctorData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const DoctorReports = () => {
  const avgScores = {
    memory: Math.round(mockPatients.reduce((s, p) => s + p.domainScores.memory, 0) / mockPatients.length),
    attention: Math.round(mockPatients.reduce((s, p) => s + p.domainScores.attention, 0) / mockPatients.length),
    executive: Math.round(mockPatients.reduce((s, p) => s + p.domainScores.executive, 0) / mockPatients.length),
    processing: Math.round(mockPatients.reduce((s, p) => s + p.domainScores.processing, 0) / mockPatients.length),
  };

  const overallAvg = Math.round(mockPatients.reduce((s, p) => s + p.overallScore, 0) / mockPatients.length);
  const improvingCount = mockPatients.filter(p => p.recentTrend === 'improving').length;
  const decliningCount = mockPatients.filter(p => p.recentTrend === 'declining').length;

  const cohortTrend = generateCohortTrend();

  const patientBarData = mockPatients.map(p => ({
    name: p.name.split(' ')[1] || p.name,
    memory: p.domainScores.memory,
    attention: p.domainScores.attention,
    executive: p.domainScores.executive,
    processing: p.domainScores.processing,
    overall: p.overallScore,
  }));

  const radarData = [
    { domain: 'Memory', score: avgScores.memory },
    { domain: 'Attention', score: avgScores.attention },
    { domain: 'Executive', score: avgScores.executive },
    { domain: 'Processing', score: avgScores.processing },
  ];

  const conditionDist = [
    { name: 'Mild', value: mockPatients.filter(p => p.condition === 'mild').length },
    { name: 'Moderate', value: mockPatients.filter(p => p.condition === 'moderate').length },
    { name: 'Severe', value: mockPatients.filter(p => p.condition === 'severe').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Aggregate performance across all patients</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cohort Avg', value: `${overallAvg}%`, icon: Brain, gradient: 'from-primary to-primary-dark' },
          { label: 'Improving', value: improvingCount, icon: TrendingUp, gradient: 'from-[hsl(var(--success))] to-[hsl(var(--success-light))]' },
          { label: 'Declining', value: decliningCount, icon: TrendingDown, gradient: 'from-[hsl(var(--destructive))] to-[hsl(0,65%,50%)]' },
          { label: 'Total Patients', value: mockPatients.length, icon: Users, gradient: 'from-[hsl(var(--secondary))] to-[hsl(var(--secondary-light))]' },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-5">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${s.gradient} w-fit mb-2`}>
                <s.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cohort Trend Line Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cohort Score Trend (8 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cohortTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} name="Avg Score" />
                <Line type="monotone" dataKey="activePlayers" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', r: 3 }} name="Active" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cohort Domain Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patient Comparison Bar Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patientBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="memory" fill="hsl(var(--memory))" radius={[2, 2, 0, 0]} name="Memory" />
              <Bar dataKey="attention" fill="hsl(var(--attention))" radius={[2, 2, 0, 0]} name="Attention" />
              <Bar dataKey="executive" fill="hsl(var(--executive))" radius={[2, 2, 0, 0]} name="Executive" />
              <Bar dataKey="processing" fill="hsl(var(--processing))" radius={[2, 2, 0, 0]} name="Processing" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Condition Distribution */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Condition Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={conditionDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} width={80} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Patients" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-patient breakdown table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="py-3 pr-4 font-medium">Patient</th>
                  <th className="py-3 px-3 font-medium">Score</th>
                  <th className="py-3 px-3 font-medium">Cog. Age</th>
                  <th className="py-3 px-3 font-medium">Memory</th>
                  <th className="py-3 px-3 font-medium">Attention</th>
                  <th className="py-3 px-3 font-medium">Executive</th>
                  <th className="py-3 px-3 font-medium">Processing</th>
                  <th className="py-3 px-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {mockPatients.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 pr-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-3 text-foreground">{p.overallScore}%</td>
                    <td className="py-3 px-3 text-foreground">{p.cognitiveAge}</td>
                    <td className="py-3 px-3 text-foreground">{p.domainScores.memory}%</td>
                    <td className="py-3 px-3 text-foreground">{p.domainScores.attention}%</td>
                    <td className="py-3 px-3 text-foreground">{p.domainScores.executive}%</td>
                    <td className="py-3 px-3 text-foreground">{p.domainScores.processing}%</td>
                    <td className="py-3 px-3">
                      <Badge variant={p.recentTrend === 'improving' ? 'default' : p.recentTrend === 'declining' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                        {p.recentTrend}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorReports;
