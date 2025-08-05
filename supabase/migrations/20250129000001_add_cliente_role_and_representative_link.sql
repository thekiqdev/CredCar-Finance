-- Add 'Cliente' role to the user_role enum
ALTER TYPE user_role ADD VALUE 'Cliente';

-- Add representative_id column to clients table to link clients to representatives
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS representative_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update clients table to use integer ID instead of UUID for consistency
ALTER TABLE clients ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE clients ALTER COLUMN id SET DEFAULT nextval('clients_id_seq'::regclass);

-- Create sequence for clients if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS clients_id_seq;
ALTER TABLE clients ALTER COLUMN id SET DEFAULT nextval('clients_id_seq');

-- Update contracts table to reference integer client_id
ALTER TABLE contracts ALTER COLUMN client_id TYPE INTEGER USING client_id::INTEGER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_representative_id ON clients(representative_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(full_name);

-- Add full_name column if it doesn't exist (for consistency with other tables)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Update existing clients to have full_name = name if full_name is null
UPDATE clients SET full_name = COALESCE(name, 'Cliente') WHERE full_name IS NULL OR full_name = '';

-- Update any remaining null or empty values with a default
UPDATE clients SET full_name = 'Cliente' WHERE full_name IS NULL OR full_name = '';

-- Make full_name NOT NULL
ALTER TABLE clients ALTER COLUMN full_name SET NOT NULL;
