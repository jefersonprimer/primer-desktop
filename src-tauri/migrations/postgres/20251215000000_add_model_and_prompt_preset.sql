ALTER TABLE chats ADD COLUMN model TEXT;
ALTER TABLE chats ADD COLUMN prompt_preset_id TEXT;
UPDATE chats SET model = 'gemini-1.5-flash' WHERE model IS NULL;
