import { Brain, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockPatients } from '@/lib/mockDoctorData';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Aggregate performance across all patients</p>
      </div>

      {/* Aggregate Scores */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cohort Average Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {(['memory', 'attention', 'executive', 'processing'] as const).map(d => (
              <div key={d}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="capitalize font-medium text-foreground">{d}</span>
                  <span className="font-bold text-foreground">{avgScores[d]}%</span>
                </div>
                <Progress value={avgScores[d]} className="h-3" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-6 text-sm">
            <div><span className="text-muted-foreground">Overall Avg:</span> <strong className="text-foreground">{overallAvg}%</strong></div>
            <div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" /><span className="text-foreground">{improvingCount} improving</span></div>
            <div className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-destructive" /><span className="text-foreground">{decliningCount} declining</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Per-patient breakdown */}
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
