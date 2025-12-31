-- Create google_calendar_events table
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL, -- references users(id) handled by app logic or foreign key if users table is in same DB
    google_event_id text NOT NULL,
    calendar_id text NOT NULL DEFAULT 'primary',
    title text NOT NULL,
    description text,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    timezone text NOT NULL,
    created_by text NOT NULL DEFAULT 'agent', -- agent | user
    source_chat_id uuid,
    status text NOT NULL DEFAULT 'confirmed', -- confirmed | canceled
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT google_calendar_events_unique UNIQUE (user_id, google_event_id)
);

-- Create google_calendar_notifications table
CREATE TABLE IF NOT EXISTS public.google_calendar_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.google_calendar_events(id) ON DELETE CASCADE,
    channel text NOT NULL, -- app | email
    trigger_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    status text DEFAULT 'pending', -- pending | sent | failed
    created_at timestamp with time zone DEFAULT now()
);
