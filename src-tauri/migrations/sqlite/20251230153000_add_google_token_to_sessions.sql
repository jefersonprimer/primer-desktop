-- Add google_access_token to sessions table
ALTER TABLE session ADD COLUMN google_access_token TEXT;
