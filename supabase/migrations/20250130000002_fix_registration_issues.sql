-- Fix registration issues and ensure proper table setup

-- Ensure user_status enum has all required values
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('Ativo', 'Inativo', 'Pendente de Aprovação', 'Documentos Pendentes', 'Pausado', 'Cancelado');
    ELSE
        -- Add missing values to existing enum if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Pendente de Aprovação' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')) THEN
            ALTER TYPE user_status ADD VALUE 'Pendente de Aprovação';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Documentos Pendentes' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')) THEN
            ALTER TYPE user_status ADD VALUE 'Documentos Pendentes';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Pausado' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')) THEN
            ALTER TYPE user_status ADD VALUE 'Pausado';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Cancelado' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')) THEN
            ALTER TYPE user_status ADD VALUE 'Cancelado';
        END IF;
    END IF;
END $$;

-- Ensure user_role enum has all required values
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Administrador', 'Suporte', 'Representante');
    ELSE
        -- Add missing values to existing enum if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Representante' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
            ALTER TYPE user_role ADD VALUE 'Representante';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Administrador' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
            ALTER TYPE user_role ADD VALUE 'Administrador';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Suporte' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
            ALTER TYPE user_role ADD VALUE 'Suporte';
        END IF;
    END IF;
END $$;

-- Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    cnpj TEXT,
    company_name TEXT,
    point_of_sale TEXT,
    commission_code TEXT,
    role user_role NOT NULL DEFAULT 'Representante',
    status user_status DEFAULT 'Ativo',
    documents_approved BOOLEAN DEFAULT FALSE,
    documents_approved_at TIMESTAMPTZ,
    documents_approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'documents_approved') THEN
        ALTER TABLE profiles ADD COLUMN documents_approved BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'documents_approved_at') THEN
        ALTER TABLE profiles ADD COLUMN documents_approved_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'documents_approved_by') THEN
        ALTER TABLE profiles ADD COLUMN documents_approved_by TEXT;
    END IF;
END $$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_commission_code ON profiles(commission_code);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON profiles;

-- Create permissive policies for profiles table (for demo purposes)
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on email" ON profiles
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON profiles
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Enable realtime for profiles table
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

-- Insert a test admin user if it doesn't exist
INSERT INTO profiles (id, full_name, email, role, status, created_at)
VALUES (
    gen_random_uuid(),
    'Administrador do Sistema',
    'admin@credicar.com',
    'Administrador',
    'Ativo',
    NOW()
)
ON CONFLICT (email) DO NOTHING;
