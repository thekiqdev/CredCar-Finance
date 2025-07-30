-- Fix profiles table permissions and ensure proper setup

-- Drop any existing foreign key constraints on profiles.id that might be causing issues
DO $$
BEGIN
    -- Drop the problematic foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- First, create or update the user_role enum to include 'Representante'
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Administrador', 'Suporte', 'Representante');
    ELSE
        -- Add 'Representante' to existing enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Representante' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
            ALTER TYPE user_role ADD VALUE 'Representante';
        END IF;
    END IF;
END $$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON profiles;

-- Create policies for profiles table
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on email" ON profiles
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON profiles
    FOR DELETE USING (true);

-- Ensure the profiles table exists with all necessary columns
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cnpj TEXT,
    company_name TEXT,
    point_of_sale TEXT,
    commission_code TEXT,
    role user_role NOT NULL DEFAULT 'Representante',
    status user_status DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- First, check if we need to change the id column type from TEXT to UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND data_type = 'text') THEN
        -- Drop the table and recreate it with proper UUID type
        DROP TABLE IF EXISTS profiles CASCADE;
        
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            cnpj TEXT,
            company_name TEXT,
            point_of_sale TEXT,
            commission_code TEXT,
            role user_role NOT NULL DEFAULT 'Representante',
            status user_status DEFAULT 'Ativo',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add columns one by one to avoid conflicts
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cnpj') THEN
            ALTER TABLE profiles ADD COLUMN cnpj TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commission_code') THEN
            ALTER TABLE profiles ADD COLUMN commission_code TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
            ALTER TABLE profiles ADD COLUMN company_name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'point_of_sale') THEN
            ALTER TABLE profiles ADD COLUMN point_of_sale TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
            ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Drop the old role column constraint if it exists and recreate with proper type
DO $$
BEGIN
    -- Check if role column exists and is not of type user_role
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND data_type = 'text') THEN
        -- Drop the constraint if it exists
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        -- Change the column type to use the enum
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    END IF;
END $$;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Enable realtime for profiles table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;