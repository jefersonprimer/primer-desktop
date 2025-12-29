-- Add preset_type column to prompt_presets table
ALTER TABLE prompt_presets ADD COLUMN preset_type TEXT DEFAULT 'assistant';

-- Insert built-in summary presets
INSERT INTO prompt_presets (id, name, description, prompt, is_built_in, preset_type) VALUES 
(
    'email_summary_default',
    'Default Email Summary',
    'Generates a concise summary of the chat for email delivery.',
    'Generate a short and clear summary of this chat for sending by email.

Focus only on:
- User intent (what did they want to accomplish?)
- Correct final AI response
- Important corrections or observations

Do not include:
- Message logs or timestamps
- Intermediate back-and-forth
- Raw code blocks unless essential

Format as:

## What you asked
[Brief description of user''s question/goal]

## AI Response
[Concise answer or solution]

## Important Notes
[Any critical observations, if applicable - omit if none]',
    1,
    'summary'
),
(
    'email_summary_detailed',
    'Detailed Email Summary',
    'Generates a more comprehensive summary with key points highlighted.',
    'Generate a comprehensive summary of this chat for email delivery.

Include:
1. **Main Topic**: What was the primary subject of discussion?
2. **Key Questions**: List the main questions asked by the user
3. **Solutions Provided**: Summarize the answers and solutions given
4. **Action Items**: Any recommended next steps or actions
5. **Important Notes**: Warnings, caveats, or critical observations

Keep the summary professional and well-organized. Use bullet points for clarity.
Do not include raw message timestamps or verbose code blocks.',
    1,
    'summary'
),
(
    'email_summary_minimal',
    'Minimal Email Summary',
    'Generates a brief one-paragraph summary.',
    'Generate a single paragraph summary of this chat (max 3-4 sentences).

Capture only the essential: what was asked and what was the final answer.
Be extremely concise. This will be sent as an email reminder.',
    1,
    'summary'
);
