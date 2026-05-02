CREATE TABLE IF NOT EXISTS public.user_bandit_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  bandit_name text NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_bandit_states_user_bandit_unique UNIQUE (user_id, bandit_name),
  CONSTRAINT user_bandit_states_bandit_name_not_blank CHECK (length(trim(bandit_name)) > 0)
);

ALTER TABLE public.user_bandit_states ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_bandit_states_user_id ON public.user_bandit_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bandit_states_bandit_name ON public.user_bandit_states(bandit_name);

DROP POLICY IF EXISTS "Users can view own bandit states" ON public.user_bandit_states;
CREATE POLICY "Users can view own bandit states"
ON public.user_bandit_states
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bandit states" ON public.user_bandit_states;
CREATE POLICY "Users can create own bandit states"
ON public.user_bandit_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bandit states" ON public.user_bandit_states;
CREATE POLICY "Users can update own bandit states"
ON public.user_bandit_states
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_bandit_states_updated_at ON public.user_bandit_states;
CREATE TRIGGER update_user_bandit_states_updated_at
BEFORE UPDATE ON public.user_bandit_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();