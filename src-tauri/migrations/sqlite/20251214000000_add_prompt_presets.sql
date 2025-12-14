-- Create prompt_presets table
CREATE TABLE IF NOT EXISTS prompt_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    is_built_in BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add prompt_preset_id to chats table
-- Note: SQLite limited ALTER TABLE support might require checking if column exists or just running it. 
-- Since we are strictly appending migrations, we assume it doesn't exist yet.
ALTER TABLE chats ADD COLUMN prompt_preset_id TEXT REFERENCES prompt_presets(id);

-- Seed built-in presets
INSERT INTO prompt_presets (id, name, description, prompt, is_built_in) VALUES 
('general', 'General Assistant', 'A helpful and versatile AI assistant.', 'You are a helpful and versatile AI assistant.', 1),
('sales', 'Sales Assistant', 'Expert in sales copy and strategy.', 'You are an expert Sales Copywriter and Strategist. Focus on conversion, persuasion, and clarity.', 1),
('leetcode', 'LeetCode Assistant', 'Helps with algorithms and data structures.', 'You are a LeetCode expert. Help the user solve algorithmic problems. Explain time and space complexity. Provide solution in the requested language.', 1),
('study', 'Study Assistant', 'Helps with learning and explaining concepts.', 'You are a Study Assistant. Explain concepts clearly and simply. Use analogies where appropriate. Quiz the user to ensure understanding.', 1),
('tech', 'Tech Candidate', 'Simulates a technical candidate for interview practice.', 'You are a Senior Developer candidate in a technical interview. Answer questions demonstrating deep knowledge but concise communication.', 1);
