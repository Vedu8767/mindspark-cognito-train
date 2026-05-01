import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Minus, Brain, Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDoctorAuth } from '@/context/DoctorAuthContext';
import {
  fetchPatients, getDoctorProfileId, assignPatientByEmail,
  type PatientWithStats,
} from '@/lib/doctorDataService';

interface Props {
  onViewPatient: (id: string) => void;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'improving') return <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />;
  if (trend === 'declining') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const riskColor = (r: string | null) =>
  r === 'high' ? 'destructive' : r === 'medium' ? 'secondary' : 'outline';

const PatientList = ({ onViewPatient }: Props) => {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [docId, setDocId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newCondition, setNewCondition] = useState<string>('');
  const [newRisk, setNewRisk] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const refresh = async (id: string | null) => {
    if (!id) return;
    const data = await fetchPatients(id);
    setPatients(data);
  };

  useEffect(() => {
    (async () => {
      const id = await getDoctorProfileId();
      setDocId(id);
      await refresh(id);
      setLoading(false);
    })();
  }, []);

  const handleAddPatient = async () => {
    if (!docId) return;
    if (!newEmail.trim()) {
      toast({ title: 'Email required', description: 'Enter the patient account email.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await assignPatientByEmail(docId, newEmail, {
      condition: newCondition || null,
      riskLevel: newRisk || null,
      notes: newNotes || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not add patient', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Patient added', description: `${newEmail} is now on your caseload.` });
    setDialogOpen(false);
    setNewEmail(''); setNewCondition(''); setNewRisk(''); setNewNotes('');
    await refresh(docId);
  };

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesCondition = conditionFilter === 'all' || p.condition === conditionFilter;
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    return matchesSearch && matchesCondition && matchesRisk;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground mt-1">{patients.length} patients enrolled</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!docId}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

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

      <div className="grid gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewPatient(p.id)}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold text-lg">{p.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Badge variant={riskColor(p.riskLevel) as any} className="text-[10px]">{p.riskLevel || 'unknown'} risk</Badge>
                    {p.condition && <Badge variant="outline" className="text-[10px]">{p.condition}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.age ? `Age ${p.age} • ` : ''}Last active: {p.lastActive ? new Date(p.lastActive).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="text-lg font-bold text-foreground">{p.overallScore}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Overall</p>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-foreground">{p.cognitiveAge ?? '—'}</span>
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
          <div className="text-center py-12 text-muted-foreground">
            {patients.length === 0 ? 'No patients assigned yet. Assign patients to see them here.' : 'No patients match your filters.'}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Patient to Caseload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="patient-email">Patient account email</Label>
              <Input
                id="patient-email"
                type="email"
                placeholder="patient@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The patient must have already signed up.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={newCondition} onValueChange={setNewCondition}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risk level</Label>
                <Select value={newRisk} onValueChange={setNewRisk}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-notes">Notes (optional)</Label>
              <Textarea
                id="patient-notes"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddPatient} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Add Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientList;
