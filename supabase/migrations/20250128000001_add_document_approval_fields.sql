-- Add document approval tracking fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_documents_approved ON profiles(documents_approved);

-- Update existing profiles to have documents_approved = false by default
UPDATE profiles SET documents_approved = FALSE WHERE documents_approved IS NULL;

-- Enable realtime for representative_documents table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'representative_documents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE representative_documents;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON representative_documents TO anon;
GRANT ALL ON representative_documents TO authenticated;
GRANT ALL ON representative_documents TO service_role;
