-- Create electronic signature fields table
CREATE TABLE IF NOT EXISTS electronic_signature_fields (
  id SERIAL PRIMARY KEY,
  signature_id TEXT UNIQUE NOT NULL,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_cpf TEXT NOT NULL,
  signature_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  client_ip TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_electronic_signature_fields_contract_id ON electronic_signature_fields(contract_id);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_fields_signature_id ON electronic_signature_fields(signature_id);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_fields_status ON electronic_signature_fields(status);

-- Enable realtime (only if not already added)
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'electronic_signature_fields'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE electronic_signature_fields;
    END IF;
END $;
