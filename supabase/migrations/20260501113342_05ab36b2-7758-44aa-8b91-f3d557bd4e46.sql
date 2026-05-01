REVOKE EXECUTE ON FUNCTION public.find_patient_profile_by_email(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_patient_profile_by_email(text) TO authenticated;