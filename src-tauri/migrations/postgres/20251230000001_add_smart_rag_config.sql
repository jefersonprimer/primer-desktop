CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    language TEXT NOT NULL DEFAULT 'en-US'
);

INSERT INTO app_config (id, language) VALUES (1, 'en-US') ON CONFLICT DO NOTHING;

ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS enable_smart_rag boolean DEFAULT false;