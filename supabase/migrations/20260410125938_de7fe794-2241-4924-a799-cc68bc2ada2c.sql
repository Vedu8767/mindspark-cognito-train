
-- Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES (Patient users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  cognitive_age INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DOCTOR PROFILES
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  specialization TEXT NOT NULL DEFAULT 'Neurology',
  clinic TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view own profile" ON public.doctor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert own profile" ON public.doctor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can update own profile" ON public.doctor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- PATIENT-DOCTOR ASSIGNMENTS
CREATE TABLE public.patient_doctor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  condition TEXT CHECK (condition IN ('mild', 'moderate', 'severe')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, doctor_id)
);

ALTER TABLE public.patient_doctor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view their assignments" ON public.patient_doctor_assignments FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can create assignments" ON public.patient_doctor_assignments FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can update assignments" ON public.patient_doctor_assignments FOR UPDATE USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Patients can view own assignments" ON public.patient_doctor_assignments FOR SELECT USING (patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.patient_doctor_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GAME SESSIONS
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  duration INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  accuracy REAL,
  reaction_time REAL,
  moves INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient sessions" ON public.game_sessions FOR SELECT USING (user_id IN (SELECT p.user_id FROM public.profiles p JOIN public.patient_doctor_assignments a ON a.patient_id = p.id JOIN public.doctor_profiles d ON d.id = a.doctor_id WHERE d.user_id = auth.uid()));
CREATE INDEX idx_game_sessions_user ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_game ON public.game_sessions(game_id);
CREATE INDEX idx_game_sessions_created ON public.game_sessions(created_at DESC);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRAINING PLANS
CREATE TABLE public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT '3 sessions/week',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view their plans" ON public.training_plans FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can create plans" ON public.training_plans FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can update plans" ON public.training_plans FOR UPDATE USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can delete plans" ON public.training_plans FOR DELETE USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Patients can view own plans" ON public.training_plans FOR SELECT USING (patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON public.training_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRAINING PLAN GAMES
CREATE TABLE public.training_plan_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'adaptive' CHECK (difficulty IN ('easy', 'medium', 'hard', 'adaptive')),
  sessions_per_week INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_plan_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view plan games" ON public.training_plan_games FOR SELECT USING (plan_id IN (SELECT id FROM public.training_plans WHERE doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Doctors can insert plan games" ON public.training_plan_games FOR INSERT WITH CHECK (plan_id IN (SELECT id FROM public.training_plans WHERE doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Doctors can update plan games" ON public.training_plan_games FOR UPDATE USING (plan_id IN (SELECT id FROM public.training_plans WHERE doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Doctors can delete plan games" ON public.training_plan_games FOR DELETE USING (plan_id IN (SELECT id FROM public.training_plans WHERE doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Patients can view own plan games" ON public.training_plan_games FOR SELECT USING (plan_id IN (SELECT id FROM public.training_plans WHERE patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- PATIENT ALERTS
CREATE TABLE public.patient_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('decline', 'inactivity', 'milestone', 'missed_session')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view their alerts" ON public.patient_alerts FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can update alerts" ON public.patient_alerts FOR UPDATE USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can delete alerts" ON public.patient_alerts FOR DELETE USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE INDEX idx_alerts_doctor ON public.patient_alerts(doctor_id);
CREATE INDEX idx_alerts_read ON public.patient_alerts(read);

-- DAILY CHALLENGES
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  game_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);
