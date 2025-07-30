-- First, let's check if the quotas table exists and what columns it has
-- If the table doesn't exist or doesn't have the status column, we'll create it properly

-- Drop and recreate the quota_status enum
DROP TYPE IF EXISTS quota_status CASCADE;
CREATE TYPE quota_status AS ENUM ('Disponível', 'Reservada', 'Ocupada', 'Cancelada/Atraso');

-- Recreate the quotas table with all required columns
DROP TABLE IF EXISTS quotas CASCADE;
CREATE TABLE quotas (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  quota_number INTEGER NOT NULL,
  status quota_status NOT NULL DEFAULT 'Disponível',
  representative_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  contract_id INTEGER,
  reserved_at TIMESTAMP WITH TIME ZONE,
  reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, quota_number)
);

-- Add payment_details column to commission_tables
ALTER TABLE commission_tables 
ADD COLUMN IF NOT EXISTS payment_details TEXT;

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  cpf_cnpj VARCHAR(18) UNIQUE,
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table with integer ID to match quotas
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  representative_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  commission_table_id INTEGER NOT NULL REFERENCES commission_tables(id),
  quota_id INTEGER REFERENCES quotas(id),
  credit_amount DECIMAL(12,2) NOT NULL,
  first_payment DECIMAL(12,2) NOT NULL,
  remaining_payments DECIMAL(12,2) NOT NULL,
  payment_term INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add the foreign key constraint for contract_id in quotas
ALTER TABLE quotas 
ADD CONSTRAINT quotas_contract_id_fkey 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- Update groups table to ensure name is unique (ignore if constraint already exists)
DO $$ 
BEGIN
    ALTER TABLE groups ADD CONSTRAINT groups_name_unique UNIQUE (name);
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Create function to automatically release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE quotas 
  SET 
    status = 'Disponível',
    reserved_at = NULL,
    reserved_by = NULL
  WHERE 
    status = 'Reservada' 
    AND reserved_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Update the quota counts trigger to handle all statuses
CREATE OR REPLACE FUNCTION update_group_quota_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE groups SET
      available_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = NEW.group_id AND status = 'Disponível'
      ),
      occupied_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = NEW.group_id AND status IN ('Ocupada', 'Reservada', 'Cancelada/Atraso')
      ),
      updated_at = NOW()
    WHERE id = NEW.group_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE groups SET
      available_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = OLD.group_id AND status = 'Disponível'
      ),
      occupied_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = OLD.group_id AND status IN ('Ocupada', 'Reservada', 'Cancelada/Atraso')
      ),
      updated_at = NOW()
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_group_quota_counts ON quotas;
CREATE TRIGGER trigger_update_group_quota_counts
  AFTER INSERT OR UPDATE OR DELETE ON quotas
  FOR EACH ROW EXECUTE FUNCTION update_group_quota_counts();

-- Add some sample data to commission_tables with payment_details
UPDATE commission_tables SET payment_details = 'Pagamento integral (1 parcela)' WHERE name = 'Tabela A';
UPDATE commission_tables SET payment_details = 'Pagamento dividido em 2 parcelas' WHERE name = 'Tabela B';
UPDATE commission_tables SET payment_details = 'Pagamento dividido em 3 parcelas' WHERE name = 'Tabela C';
UPDATE commission_tables SET payment_details = 'Pagamento dividido em 4 parcelas' WHERE name = 'Tabela D';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotas_group_id ON quotas(group_id);
CREATE INDEX IF NOT EXISTS idx_quotas_status ON quotas(status);
CREATE INDEX IF NOT EXISTS idx_quotas_representative_id ON quotas(representative_id);
CREATE INDEX IF NOT EXISTS idx_quotas_contract_id ON quotas(contract_id);
CREATE INDEX IF NOT EXISTS idx_quotas_reserved_by ON quotas(reserved_by);
CREATE INDEX IF NOT EXISTS idx_contracts_representative_id ON contracts(representative_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);