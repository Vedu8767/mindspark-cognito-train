import { supabase } from '@/integrations/supabase/client';

// Types for doctor dashboard (replaces mockDoctorData types for real data)
export interface PatientWithStats {
  id: string; // profiles.id
  userId: string;
  name: string;
  email: string | null;
  age: number | null;
  dateOfBirth: string | null;
  cognitiveAge: number | null;
  currentStreak: number;
  longestStreak: number;
  avatarUrl: string | null;
  // from assignment
  condition: string | null;
  riskLevel: string | null;
  enrolledDate: string;
  // computed
  overallScore: number;
  domainScores: { memory: number; attention: number; executive: number; processing: number };
  recentTrend: 'improving' | 'stable' | 'declining';
  totalSessions: number;
  lastActive: string | null;
}

export interface AlertRow {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PlanRow {
  id: string;
  name: string;
  patientId: string;
  patientName: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  games: PlanGameRow[];
}

export interface PlanGameRow {
  id: string;
  gameId: string;
  gameName: string;
  domain: string;
  difficulty: string;
  sessionsPerWeek: number;
}

/** Fetch the doctor_profile.id for the current user */
export async function getDoctorProfileId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  return data?.id ?? null;
}

/** Fetch all patients assigned to the current doctor with computed stats */
export async function fetchPatients(doctorProfileId: string): Promise<PatientWithStats[]> {
  // 1) Get assignments
  const { data: assignments, error: aErr } = await supabase
    .from('patient_doctor_assignments')
    .select('*')
    .eq('doctor_id', doctorProfileId)
    .eq('status', 'active');

  if (aErr || !assignments || assignments.length === 0) return [];

  const patientIds = assignments.map(a => a.patient_id);

  // 2) Get profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', patientIds);

  if (!profiles) return [];

  // 3) Get game sessions for these patients (by user_id)
  const userIds = profiles.map(p => p.user_id);
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(1000);

  const allSessions = sessions || [];

  // Build patient objects
  return profiles.map(p => {
    const assignment = assignments.find(a => a.patient_id === p.id);
    const pSessions = allSessions.filter(s => s.user_id === p.user_id);
    const domainScores = computeDomainScores(pSessions);
    const overallScore = Math.round((domainScores.memory + domainScores.attention + domainScores.executive + domainScores.processing) / 4);
    const recentTrend = computeTrend(pSessions);
    const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    return {
      id: p.id,
      userId: p.user_id,
      name: p.name,
      email: p.email,
      age,
      dateOfBirth: p.date_of_birth,
      cognitiveAge: p.cognitive_age,
      currentStreak: p.current_streak,
      longestStreak: p.longest_streak,
      avatarUrl: p.avatar_url,
      condition: assignment?.condition ?? null,
      riskLevel: assignment?.risk_level ?? null,
      enrolledDate: assignment?.enrolled_date ?? '',
      overallScore,
      domainScores,
      recentTrend,
      totalSessions: pSessions.length,
      lastActive: pSessions.length > 0 ? pSessions[0].created_at : null,
    };
  });
}

function computeDomainScores(sessions: any[]): { memory: number; attention: number; executive: number; processing: number } {
  const domains = { memory: [] as number[], attention: [] as number[], executive: [] as number[], processing: [] as number[] };
  // Use last 20 sessions per domain
  for (const s of sessions) {
    const d = s.domain?.toLowerCase();
    if (d && d in domains) {
      (domains as any)[d].push(s.score);
    }
  }
  const avg = (arr: number[]) => arr.length === 0 ? 50 : Math.round(arr.slice(0, 20).reduce((a, b) => a + b, 0) / Math.min(arr.length, 20));
  return { memory: avg(domains.memory), attention: avg(domains.attention), executive: avg(domains.executive), processing: avg(domains.processing) };
}

function computeTrend(sessions: any[]): 'improving' | 'stable' | 'declining' {
  if (sessions.length < 4) return 'stable';
  const recent = sessions.slice(0, Math.ceil(sessions.length / 2));
  const older = sessions.slice(Math.ceil(sessions.length / 2));
  const avgRecent = recent.reduce((a: number, b: any) => a + b.score, 0) / recent.length;
  const avgOlder = older.reduce((a: number, b: any) => a + b.score, 0) / older.length;
  const diff = avgRecent - avgOlder;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/** Fetch alerts for the current doctor */
export async function fetchAlerts(doctorProfileId: string): Promise<AlertRow[]> {
  const { data: alerts } = await supabase
    .from('patient_alerts')
    .select('*, profiles:patient_id(name)')
    .eq('doctor_id', doctorProfileId)
    .order('created_at', { ascending: false });

  if (!alerts) return [];

  return alerts.map((a: any) => ({
    id: a.id,
    patientId: a.patient_id,
    patientName: a.profiles?.name ?? 'Unknown',
    type: a.type,
    severity: a.severity,
    message: a.message,
    timestamp: a.created_at,
    read: a.read,
  }));
}

/** Mark an alert as read */
export async function markAlertRead(alertId: string) {
  await supabase.from('patient_alerts').update({ read: true }).eq('id', alertId);
}

/** Mark all alerts as read */
export async function markAllAlertsRead(doctorProfileId: string) {
  await supabase.from('patient_alerts').update({ read: true }).eq('doctor_id', doctorProfileId).eq('read', false);
}

/** Delete an alert */
export async function deleteAlert(alertId: string) {
  await supabase.from('patient_alerts').delete().eq('id', alertId);
}

/** Fetch training plans for the current doctor */
export async function fetchTrainingPlans(doctorProfileId: string): Promise<PlanRow[]> {
  const { data: plans } = await supabase
    .from('training_plans')
    .select('*, profiles:patient_id(name), training_plan_games(*)')
    .eq('doctor_id', doctorProfileId)
    .order('created_at', { ascending: false });

  if (!plans) return [];

  return plans.map((p: any) => ({
    id: p.id,
    name: p.name,
    patientId: p.patient_id,
    patientName: p.profiles?.name ?? 'Unknown',
    frequency: p.frequency,
    startDate: p.start_date,
    endDate: p.end_date,
    status: p.status,
    notes: p.notes,
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

/** Create a training plan with games */
export async function createTrainingPlan(
  doctorProfileId: string,
  data: { name: string; patientId: string; frequency: string; notes?: string; games: Omit<PlanGameRow, 'id'>[] }
) {
  const { data: plan, error } = await supabase
    .from('training_plans')
    .insert({
      doctor_id: doctorProfileId,
      patient_id: data.patientId,
      name: data.name,
      frequency: data.frequency,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error || !plan) return { error: error?.message || 'Failed to create plan' };

  if (data.games.length > 0) {
    const { error: gErr } = await supabase.from('training_plan_games').insert(
      data.games.map(g => ({
        plan_id: plan.id,
        game_id: g.gameId,
        game_name: g.gameName,
        domain: g.domain,
        difficulty: g.difficulty,
        sessions_per_week: g.sessionsPerWeek,
      }))
    );
    if (gErr) return { error: gErr.message };
  }

  return { error: null, planId: plan.id };
}

/** Update a training plan status */
export async function updatePlanStatus(planId: string, status: string, endDate?: string) {
  await supabase.from('training_plans').update({ status, end_date: endDate || null }).eq('id', planId);
}

/** Delete a training plan (cascades to games via FK) */
export async function deleteTrainingPlan(planId: string) {
  await supabase.from('training_plan_games').delete().eq('plan_id', planId);
  await supabase.from('training_plans').delete().eq('id', planId);
}

/** Fetch session history for a specific patient (by profile.id) */
export async function fetchPatientSessions(patientProfileId: string, limit = 50) {
  // Need the user_id from profile
  const { data: profile } = await supabase.from('profiles').select('user_id').eq('id', patientProfileId).single();
  if (!profile) return [];

  const { data } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/** Fetch unread alert count */
export async function fetchUnreadAlertCount(doctorProfileId: string): Promise<number> {
  const { count } = await supabase
    .from('patient_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorProfileId)
    .eq('read', false);
  return count ?? 0;
}
