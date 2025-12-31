-- Migration: Add Notion Integration Support
-- Created at: 2024-12-31

BEGIN;

CREATE TABLE public.notion_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  bot_id text NOT NULL,
  workspace_id text NOT NULL,
  workspace_name text,
  workspace_icon text,
  owner_type text NOT NULL,
  duplicated_template_id text,
  token_type text DEFAULT 'bearer'::text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notion_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT notion_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT notion_integrations_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.notion_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notion_page_id text NOT NULL UNIQUE,
  parent_page_id text,
  parent_database_id text,
  title text NOT NULL,
  url text NOT NULL,
  source_chat_id uuid,
  source_message_id uuid,
  created_by text DEFAULT 'agent'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notion_pages_pkey PRIMARY KEY (id),
  CONSTRAINT notion_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT notion_pages_source_chat_id_fkey FOREIGN KEY (source_chat_id) REFERENCES public.chats(id) ON DELETE SET NULL,
  CONSTRAINT notion_pages_source_message_id_fkey FOREIGN KEY (source_message_id) REFERENCES public.messages(id) ON DELETE SET NULL
);

CREATE INDEX idx_notion_integrations_user_id ON public.notion_integrations(user_id);
CREATE INDEX idx_notion_pages_user_id ON public.notion_pages(user_id);
CREATE INDEX idx_notion_pages_notion_page_id ON public.notion_pages(notion_page_id);
CREATE INDEX idx_notion_pages_source_chat_id ON public.notion_pages(source_chat_id);
CREATE INDEX idx_notion_pages_created_at ON public.notion_pages(created_at DESC);

COMMIT;
