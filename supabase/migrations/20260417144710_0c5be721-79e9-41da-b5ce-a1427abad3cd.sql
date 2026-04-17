-- Create game_progress table for per-user, per-game level persistence
CREATE TABLE public.game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  highest_level INTEGER NOT NULL DEFAULT 1,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable Row Level Security
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Patients: view own progress
CREATE POLICY "Users can view own progress"
ON public.game_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Patients: insert own progress
CREATE POLICY "Users can insert own progress"
ON public.game_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Patients: update own progress
CREATE POLICY "Users can update own progress"
ON public.game_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Doctors: view assigned patient progress
CREATE POLICY "Doctors can view patient progress"
ON public.game_progress
FOR SELECT
USING (
  user_id IN (
    SELECT p.user_id
    FROM profiles p
    JOIN patient_doctor_assignments a ON a.patient_id = p.id
    JOIN doctor_profiles d ON d.id = a.doctor_id
    WHERE d.user_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_game_progress_user_game ON public.game_progress(user_id, game_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_game_progress_updated_at
BEFORE UPDATE ON public.game_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();