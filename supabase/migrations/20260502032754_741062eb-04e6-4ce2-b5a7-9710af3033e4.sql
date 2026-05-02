DROP POLICY IF EXISTS "Users can delete own bandit states" ON public.user_bandit_states;
CREATE POLICY "Users can delete own bandit states"
ON public.user_bandit_states
FOR DELETE
USING (auth.uid() = user_id);