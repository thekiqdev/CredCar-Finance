-- Add visibility column to planos table
ALTER TABLE planos ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'publico';

-- Update existing records to have 'publico' visibility
UPDATE planos SET visibility = 'publico' WHERE visibility IS NULL;

-- Add check constraint to ensure only valid values
ALTER TABLE planos ADD CONSTRAINT planos_visibility_check CHECK (visibility IN ('publico', 'privado'));
