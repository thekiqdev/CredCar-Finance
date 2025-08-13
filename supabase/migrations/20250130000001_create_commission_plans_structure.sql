-- Create the simplified commission table structure

-- Table 1: Planos (Plans) - Remains the same
CREATE TABLE IF NOT EXISTS planos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Faixas de Credito (Credit Ranges) - Simplified with total installments only
CREATE TABLE IF NOT EXISTS faixas_de_credito (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
    valor_credito DECIMAL(10,2) NOT NULL,
    valor_primeira_parcela DECIMAL(10,2) NOT NULL,
    valor_parcelas_restantes DECIMAL(10,2) NOT NULL,
    numero_total_parcelas INTEGER NOT NULL DEFAULT 80,
    valor_restante DECIMAL(10,2) GENERATED ALWAYS AS (valor_credito - valor_primeira_parcela) STORED
);

-- Table 3: CondicoesAntecipacao (Anticipation Conditions) - Remains the same
DROP TABLE IF EXISTS condicoes_antecipacao CASCADE;
CREATE TABLE condicoes_antecipacao (
    id SERIAL PRIMARY KEY,
    faixa_credito_id INTEGER NOT NULL REFERENCES faixas_de_credito(id) ON DELETE CASCADE,
    percentual INTEGER NOT NULL,
    valor_calculado DECIMAL(10,2) NOT NULL
);

-- Remove the CondicoesParcelas table as it's no longer needed
-- Individual installments will be generated automatically based on numero_total_parcelas
DROP TABLE IF EXISTS condicoes_parcelas CASCADE;

-- Enable realtime for remaining tables (conditionally)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'planos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE planos;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'faixas_de_credito'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE faixas_de_credito;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'condicoes_antecipacao'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE condicoes_antecipacao;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faixas_de_credito_plano_id ON faixas_de_credito(plano_id);
CREATE INDEX IF NOT EXISTS idx_condicoes_antecipacao_faixa_credito_id ON condicoes_antecipacao(faixa_credito_id);

-- Insert sample data for demonstration
-- First insert the plans
INSERT INTO planos (nome, descricao, ativo) VALUES 
('Plano A', 'Compra Programada 80X - Premium', true),
('Plano B', 'Compra Programada 80X - Padrão', true),
('Plano C', 'Compra Programada 80X - Flexível', true),
('Plano D', 'Compra Programada 80X - Básico', true)
ON CONFLICT DO NOTHING;

-- Then insert credit ranges for Plano A
INSERT INTO faixas_de_credito (plano_id, valor_credito, valor_primeira_parcela, valor_parcelas_restantes, numero_total_parcelas) 
SELECT p.id, 20000.00, 2000.00, 250.00, 80 FROM planos p WHERE p.nome = 'Plano A'
UNION ALL
SELECT p.id, 25000.00, 2500.00, 312.50, 80 FROM planos p WHERE p.nome = 'Plano A'
UNION ALL
SELECT p.id, 30000.00, 3000.00, 375.00, 80 FROM planos p WHERE p.nome = 'Plano A'
UNION ALL
SELECT p.id, 35000.00, 3500.00, 437.50, 80 FROM planos p WHERE p.nome = 'Plano A'
UNION ALL
SELECT p.id, 40000.00, 4000.00, 500.00, 80 FROM planos p WHERE p.nome = 'Plano A'
ON CONFLICT DO NOTHING;

-- No need to insert individual installment conditions
-- The system will automatically generate monthly installments based on numero_total_parcelas

-- Sample anticipation conditions for the credit ranges
INSERT INTO condicoes_antecipacao (faixa_credito_id, percentual, valor_calculado) 
SELECT fc.id, 20, 4000.00 FROM faixas_de_credito fc JOIN planos p ON fc.plano_id = p.id WHERE p.nome = 'Plano A' AND fc.valor_credito = 20000.00
UNION ALL
SELECT fc.id, 25, 5000.00 FROM faixas_de_credito fc JOIN planos p ON fc.plano_id = p.id WHERE p.nome = 'Plano A' AND fc.valor_credito = 20000.00
UNION ALL
SELECT fc.id, 30, 6000.00 FROM faixas_de_credito fc JOIN planos p ON fc.plano_id = p.id WHERE p.nome = 'Plano A' AND fc.valor_credito = 20000.00
ON CONFLICT DO NOTHING;