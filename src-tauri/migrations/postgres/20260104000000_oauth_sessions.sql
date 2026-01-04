CREATE TABLE IF NOT EXISTS public.oauth_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL, -- web | desktop | dev
  provider text NOT NULL, -- google, github, etc
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT oauth_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT oauth_sessions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

