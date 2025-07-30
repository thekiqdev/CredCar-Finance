-- Create contract_signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name VARCHAR(255) NOT NULL,
  signer_cpf VARCHAR(11) NOT NULL,
  signature_image_url TEXT NOT NULL,
  client_ip VARCHAR(45),
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  document_type VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);

-- Enable realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE contract_signatures;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_documents;
