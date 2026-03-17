import { useState } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { mockPatients, type Patient } from '@/lib/mockDoctorData';

interface Props {
  onViewPatient: (id: string) => void;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'improving') return <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />;
  if (trend === 'declining') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const riskColor = (r: string) =>
  r === 'high' ? 'destructive' : r === 'medium' ? 'secondary' : 'outline';

const PatientList = ({ onViewPatient }: Props) => {
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const filtered = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesCondition = conditionFilter === 'all' || p.condition === conditionFilter;
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    return matchesSearch && matchesCondition && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1">{mockPatients.length} patients enrolled</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="mild">Mild</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="severe">Severe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewPatient(p.id)}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold text-lg">{p.name.charAt(0)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Badge variant={riskColor(p.riskLevel) as any} className="text-[10px]">{p.riskLevel} risk</Badge>
                    <Badge variant="outline" className="text-[10px]">{p.condition}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Age {p.age} • Last active: {new Date(p.lastActive).toLocaleDateString()}</p>
                </div>

                {/* Score + Trend */}
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="text-lg font-bold text-foreground">{p.overallScore}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Overall</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-foreground">{p.cognitiveAge}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Cog. Age</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <TrendIcon trend={p.recentTrend} />
                      <span className="text-xs font-medium capitalize text-foreground">{p.recentTrend}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Trend</p>
                  </div>
                </div>
              </div>

              {/* Domain bars */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {(['memory', 'attention', 'executive', 'processing'] as const).map(d => (
                  <div key={d}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground capitalize">{d}</span>
                      <span className="font-medium text-foreground">{p.domainScores[d]}%</span>
                    </div>
                    <Progress value={p.domainScores[d]} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No patients match your filters.</div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
