-- 1. Changes to messages table
ALTER TABLE public.messages
ADD COLUMN summary text,
ADD COLUMN message_type text DEFAULT 'chat',
ADD COLUMN importance smallint DEFAULT 0;

-- 2. New table chat_summaries
CREATE TABLE public.chat_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL,
    topic text NOT NULL,
    summary text NOT NULL,
    source_message_ids uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_summaries_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);

-- 3. Indexes
CREATE INDEX idx_messages_chat_created ON public.messages (chat_id, created_at DESC);
CREATE INDEX idx_messages_type_importance ON public.messages (message_type, importance DESC);
CREATE INDEX idx_chat_summaries_chat ON public.chat_summaries (chat_id);

-- 4. Embedding Bridge
CREATE TABLE public.rag_entities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL, -- message | chat_summary
    entity_id uuid NOT NULL,
    embedding_id text, -- used when a vector exists in the DB
    created_at timestamp with time zone DEFAULT now()
);
