-- Create CondicoesParcelas table to store custom installment values for specific credit ranges
CREATE TABLE IF NOT EXISTS condicoes_parcelas (
  id SERIAL PRIMARY KEY,
  faixa_credito_id INT NOT NULL REFERENCES faixas_de_credito(id) ON DELETE CASCADE,
  numero_parcela INT NOT NULL,
  valor_parcela DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faixa_credito_id, numero_parcela)
);

-- Add comment to table
COMMENT ON TABLE condicoes_parcelas IS 'Stores custom installment values for specific credit ranges';

-- Add comments to columns
COMMENT ON COLUMN condicoes_parcelas.id IS 'Primary key';
COMMENT ON COLUMN condicoes_parcelas.faixa_credito_id IS 'Foreign key reference to faixas_de_credito table';
COMMENT ON COLUMN condicoes_parcelas.numero_parcela IS 'Installment number (e.g., 1, 2, 3)';
COMMENT ON COLUMN condicoes_parcelas.valor_parcela IS 'Custom monetary value for this specific installment';

-- Enable row-level security (RLS) but with a permissive policy for now
ALTER TABLE condicoes_parcelas ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
DROP POLICY IF EXISTS "Administrators can manage custom installments" ON condicoes_parcelas;
CREATE POLICY "Administrators can manage custom installments"
ON condicoes_parcelas
FOR ALL
USING (true);

-- Enable realtime subscriptions
alter publication supabase_realtime add table condicoes_parcelas;
