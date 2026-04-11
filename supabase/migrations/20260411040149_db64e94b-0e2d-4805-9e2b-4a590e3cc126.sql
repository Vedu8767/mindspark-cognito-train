
-- Allow doctors to view profiles of their assigned patients
CREATE POLICY "Doctors can view assigned patient profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT patient_id FROM public.patient_doctor_assignments
      WHERE doctor_id IN (
        SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
      )
    )
  );
