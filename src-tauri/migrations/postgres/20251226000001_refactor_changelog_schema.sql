DROP TABLE IF EXISTS public.changelog;

CREATE TABLE IF NOT EXISTS public.changelogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT changelogs_pkey PRIMARY KEY (id)
);
