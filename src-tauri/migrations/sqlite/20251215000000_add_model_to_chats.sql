ALTER TABLE chats ADD COLUMN model TEXT;
UPDATE chats SET model = 'gemini-1.5-flash' WHERE model IS NULL;
