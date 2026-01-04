-- Add google_refresh_token and expiration to sessions table
ALTER TABLE session ADD COLUMN google_refresh_token TEXT;
ALTER TABLE session ADD COLUMN google_token_expires_at INTEGER;
