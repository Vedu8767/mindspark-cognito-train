import { supabase } from '@/integrations/supabase/client';

export interface AssignedGame {
  id: string;
  gameId: string;
  gameName: string;
  domain: string;
  difficulty: string;
  sessionsPerWeek: number;
}

export interface AssignedPlan {
  id: string;
  name: string;
  frequency: string;
  status: string;
  notes: string | null;
  startDate: string;
  endDate: string | null;
  doctorName: string | null;
  games: AssignedGame[];
}

/** Fetch active training plans assigned to the current patient. */
export async function getMyTrainingPlans(): Promise<AssignedPlan[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return [];

  const { data: plans, error } = await supabase
    .from('training_plans')
    .select('*, training_plan_games(*), doctor_profiles:doctor_id(name)')
    .eq('patient_id', profile.id)
    .order('created_at', { ascending: false });

  if (error || !plans) return [];

  return plans.map((p: any) => ({
    id: p.id,
    name: p.name,
    frequency: p.frequency,
    status: p.status,
    notes: p.notes,
    startDate: p.start_date,
    endDate: p.end_date,
    doctorName: p.doctor_profiles?.name ?? null,
    games: (p.training_plan_games || []).map((g: any) => ({
      id: g.id,
      gameId: g.game_id,
      gameName: g.game_name,
      domain: g.domain,
      difficulty: g.difficulty,
      sessionsPerWeek: g.sessions_per_week,
    })),
  }));
}