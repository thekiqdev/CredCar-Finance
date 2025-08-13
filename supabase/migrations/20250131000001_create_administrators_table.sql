CREATE TABLE IF NOT EXISTS administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Administrador' CHECK (role IN ('Administrador', 'Suporte')),
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Pausado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_administrators_email ON administrators(email);
CREATE INDEX IF NOT EXISTS idx_administrators_role ON administrators(role);
CREATE INDEX IF NOT EXISTS idx_administrators_status ON administrators(status);

INSERT INTO administrators (id, full_name, email, phone, role, status, created_at, updated_at)
SELECT 
    id,
    full_name,
    email,
    phone,
    role,
    status,
    created_at,
    COALESCE(created_at, NOW())
FROM profiles 
WHERE role IN ('Administrador', 'Suporte');

DELETE FROM profiles WHERE role IN ('Administrador', 'Suporte');

-- Add table to realtime publication only if not already added
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'administrators'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE administrators;
    END IF;
END $;