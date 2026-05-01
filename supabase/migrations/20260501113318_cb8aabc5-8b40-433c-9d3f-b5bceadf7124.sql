-- Security-definer helper that lets a doctor find a patient profile by email
-- so they can enroll the patient into their caseload.
CREATE OR REPLACE FUNCTION public.find_patient_profile_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE lower(p.email) = lower(_email)
    -- Caller must be an authenticated doctor.
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles d WHERE d.user_id = auth.uid()
    )
  LIMIT 1
$$;