CREATE TABLE IF NOT EXISTS contract_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (visibility IN ('admin', 'all')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_visibility ON contract_templates(visibility);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON contract_templates(created_by);