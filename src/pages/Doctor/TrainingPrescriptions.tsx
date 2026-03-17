import { useState } from 'react';
import { Plus, ClipboardList, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { mockTrainingPlans, mockPatients, AVAILABLE_GAMES, type TrainingPlan, type TrainingPlanGame } from '@/lib/mockDoctorData';
import { useToast } from '@/hooks/use-toast';

const TrainingPrescriptions = () => {
  const [plans, setPlans] = useState<TrainingPlan[]>(mockTrainingPlans);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // New plan form state
  const [planName, setPlanName] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGames, setSelectedGames] = useState<TrainingPlanGame[]>([]);

  const addGame = (gameId: string) => {
    const game = AVAILABLE_GAMES.find(g => g.id === gameId);
    if (!game || selectedGames.find(g => g.gameId === gameId)) return;
    setSelectedGames(prev => [...prev, { gameId: game.id, gameName: game.name, domain: game.domain, difficulty: 'adaptive', sessionsPerWeek: 2 }]);
  };

  const removeGame = (gameId: string) => setSelectedGames(prev => prev.filter(g => g.gameId !== gameId));

  const updateGameSetting = (gameId: string, field: keyof TrainingPlanGame, value: any) => {
    setSelectedGames(prev => prev.map(g => g.gameId === gameId ? { ...g, [field]: value } : g));
  };

  const handleCreate = () => {
    if (!planName || !selectedPatient || selectedGames.length === 0) {
      toast({ title: 'Missing fields', description: 'Fill in plan name, patient, and at least one game.', variant: 'destructive' });
      return;
    }
    const patient = mockPatients.find(p => p.id === selectedPatient);
    const newPlan: TrainingPlan = {
      id: `plan-${Date.now()}`, name: planName, patientId: selectedPatient,
      patientName: patient?.name || '', frequency: frequency || '3 sessions/week',
      startDate: new Date().toISOString().split('T')[0], status: 'active',
      notes: notes || undefined, games: selectedGames,
    };
    setPlans(prev => [...prev, newPlan]);
    toast({ title: 'Plan created', description: `"${planName}" assigned to ${patient?.name}` });
    setDialogOpen(false);
    setPlanName(''); setSelectedPatient(''); setFrequency(''); setNotes(''); setSelectedGames([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Plans</h1>
          <p className="text-muted-foreground mt-1">Prescribe and manage cognitive training programs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Training Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input placeholder="e.g. Memory Enhancement Plan" value={planName} onChange={e => setPlanName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{mockPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Input placeholder="e.g. 4 sessions/week" value={frequency} onChange={e => setFrequency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Add Games</Label>
                <Select onValueChange={addGame}>
                  <SelectTrigger><SelectValue placeholder="Select a game to add" /></SelectTrigger>
                  <SelectContent>{AVAILABLE_GAMES.filter(g => !selectedGames.find(sg => sg.gameId === g.id)).map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.domain})</SelectItem>)}</SelectContent>
                </Select>
                {selectedGames.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedGames.map(g => (
                      <div key={g.gameId} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{g.gameName}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeGame(g.gameId)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={g.difficulty} onValueChange={v => updateGameSetting(g.gameId, 'difficulty', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="adaptive">Adaptive</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Input type="number" min={1} max={7} value={g.sessionsPerWeek} onChange={e => updateGameSetting(g.gameId, 'sessionsPerWeek', parseInt(e.target.value) || 1)} className="h-8 text-xs" />
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">x/wk</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea placeholder="Clinical notes for this plan..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">Create Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans list */}
      <div className="grid gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{plan.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Patient: {plan.patientName} • {plan.frequency} • Since {new Date(plan.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              {plan.notes && <p className="text-xs text-muted-foreground italic mb-3">"{plan.notes}"</p>}
              <div className="flex flex-wrap gap-2">
                {plan.games.map(g => (
                  <Badge key={g.gameId} variant="secondary" className="text-xs">
                    {g.gameName} • {g.difficulty} • {g.sessionsPerWeek}x/wk
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrainingPrescriptions;
