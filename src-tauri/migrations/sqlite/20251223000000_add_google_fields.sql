-- Add google_id, full_name, profile_picture to users table
ALTER TABLE users ADD COLUMN google_id TEXT;
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id);
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN profile_picture TEXT;

-- Make password_hash nullable (this is tricky in SQLite as ALTER COLUMN is limited)
-- SQLite doesn't support dropping NOT NULL constraint directly easily.
-- For now, we will allow empty string or dummy value if password is not set, 
-- or we can create a new table and copy data.
-- However, since this is "dev" environment mostly for SQLite, we can just keep password_hash NOT NULL 
-- and insert a placeholder for Google users, OR better:
-- SQLite 3.35+ supports DROP COLUMN.
-- But changing column definition is hard.
-- Let's stick to using a placeholder or accepting that we might need to recreate table if we want strict schema.
-- Given the "pseudocode" request and speed, I will use a workaround or just leave it as is 
-- and fill it with a placeholder string like "GOOGLE_AUTH" for google users.
