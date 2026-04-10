
-- Allow users to insert their own roles (needed for doctor signup)
CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow doctors to insert alerts
CREATE POLICY "Doctors can insert alerts" ON public.patient_alerts
  FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
