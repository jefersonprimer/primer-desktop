CREATE TABLE IF NOT EXISTS public.changelog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version text NOT NULL,
  released_at date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  title text,
  subtitle text,
  content text,
  CONSTRAINT changelog_pkey PRIMARY KEY (id)
);
