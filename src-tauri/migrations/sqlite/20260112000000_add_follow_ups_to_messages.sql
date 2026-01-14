-- Add follow_ups column to messages table
-- Stored as JSON string (e.g., '["Option 1", "Option 2", "Option 3"]')
ALTER TABLE messages ADD COLUMN follow_ups TEXT;
