-- Helper: returns the current doctor's profile id (or null) without recursing through profiles
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Helper: is this profile id assigned to the current doctor?
CREATE OR REPLACE FUNCTION public.is_assigned_patient_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_doctor_assignments a
    WHERE a.patient_id = _profile_id
      AND a.doctor_id = public.current_doctor_id()
  )
$$;

-- Helper: is this auth.users id assigned (as a patient) to the current doctor?
CREATE OR REPLACE FUNCTION public.is_assigned_patient_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_doctor_assignments a
    JOIN public.profiles p ON p.id = a.patient_id
    WHERE p.user_id = _user_id
      AND a.doctor_id = public.current_doctor_id()
  )
$$;

-- PROFILES: replace recursive doctor policy
DROP POLICY IF EXISTS "Doctors can view assigned patient profiles" ON public.profiles;
CREATE POLICY "Doctors can view assigned patient profiles"
  ON public.profiles FOR SELECT
  USING (public.is_assigned_patient_profile(id));

-- GAME_PROGRESS: replace recursive doctor policy
DROP POLICY IF EXISTS "Doctors can view patient progress" ON public.game_progress;
CREATE POLICY "Doctors can view patient progress"
  ON public.game_progress FOR SELECT
  USING (public.is_assigned_patient_user(user_id));

-- GAME_SESSIONS: replace recursive doctor policy
DROP POLICY IF EXISTS "Doctors can view patient sessions" ON public.game_sessions;
CREATE POLICY "Doctors can view patient sessions"
  ON public.game_sessions FOR SELECT
  USING (public.is_assigned_patient_user(user_id));