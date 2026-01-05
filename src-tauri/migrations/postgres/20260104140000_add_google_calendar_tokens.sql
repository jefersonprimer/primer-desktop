-- Migration: Add Google Calendar token columns to users table

-- Add columns for separate Google Calendar tokens
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_calendar_connected 
ON users (id) 
WHERE google_calendar_token IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN users.google_calendar_token IS 'Access token specifically for Google Calendar API (separate from login)';
COMMENT ON COLUMN users.google_calendar_refresh_token IS 'Refresh token for Google Calendar API to maintain long-term access';
COMMENT ON COLUMN users.google_calendar_connected_at IS 'Timestamp when user connected their Google Calendar';
