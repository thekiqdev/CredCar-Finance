-- Fix UUID issues and ensure proper setup

-- Clean up any invalid UUID entries that might exist
DELETE FROM profiles WHERE id = 'admin-user-id-12345';

-- Insert a proper admin user with valid UUID
INSERT INTO profiles (id, full_name, email, role, status, created_at)
VALUES (
    gen_random_uuid(),
    'Administrador do Sistema',
    'admin@credcar.com',
    'Administrador',
    'Ativo',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Ensure all existing profiles have valid UUIDs
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM profiles WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LOOP
        -- Update invalid UUIDs with proper ones
        UPDATE profiles SET id = gen_random_uuid() WHERE id = rec.id;
    END LOOP;
END $$;

-- Refresh the realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Grant all necessary permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
