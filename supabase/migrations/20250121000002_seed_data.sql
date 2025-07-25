-- Add unique constraint to commission_tables name column
ALTER TABLE public.commission_tables ADD CONSTRAINT unique_commission_table_name UNIQUE (name);

-- Insert sample commission tables
INSERT INTO public.commission_tables (name, description, commission_percentage, payment_installments) VALUES
('Tabela A - Premium', 'Comissão premium para representantes experientes - Pagamento integral', 4.00, 1),
('Tabela B - Padrão', 'Comissão padrão - Pagamento em 2 parcelas', 3.50, 2),
('Tabela C - Flexível', 'Comissão flexível - Pagamento em 3 parcelas', 3.00, 3),
('Tabela D - Básica', 'Comissão básica - Pagamento em 4 parcelas', 2.50, 4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample clients
INSERT INTO public.clients (full_name, email, phone, cpf_cnpj, address) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-0001', '123.456.789-00', 'Rua das Flores, 123 - São Paulo, SP'),
('Maria Santos', 'maria.santos@email.com', '(11) 99999-0002', '987.654.321-00', 'Av. Paulista, 456 - São Paulo, SP'),
('Pedro Costa', 'pedro.costa@email.com', '(11) 99999-0003', '456.789.123-00', 'Rua Augusta, 789 - São Paulo, SP'),
('Lucia Ferreira', 'lucia.ferreira@email.com', '(11) 99999-0004', '789.123.456-00', 'Rua Oscar Freire, 321 - São Paulo, SP'),
('Roberto Alves', 'roberto.alves@email.com', '(11) 99999-0005', '321.654.987-00', 'Rua Consolação, 654 - São Paulo, SP'),
('Ana Costa', 'ana.costa@email.com', '(11) 99999-0006', '654.987.321-00', 'Av. Faria Lima, 987 - São Paulo, SP'),
('Carlos Lima', 'carlos.lima@email.com', '(11) 99999-0007', '147.258.369-00', 'Rua Bela Cintra, 147 - São Paulo, SP'),
('Fernanda Silva', 'fernanda.silva@email.com', '(11) 99999-0008', '258.369.147-00', 'Av. Rebouças, 258 - São Paulo, SP')
ON CONFLICT (cpf_cnpj) DO NOTHING;

-- Note: We cannot insert into auth.users directly via SQL migration
-- The profiles will be created when users register through the application
-- But we can prepare some sample profile data structure for reference

-- Sample profiles structure (will be created via application registration)
-- These are examples of what will be created:
-- Carlos Oliveira: role: 'Representante', status: 'Ativo', cnpj: '12.345.678/0001-90'
-- Ana Pereira: role: 'Representante', status: 'Ativo', cnpj: '23.456.789/0001-01'
-- Marcos Souza: role: 'Representante', status: 'Ativo', cnpj: '34.567.890/0001-12'
-- Juliana Costa: role: 'Representante', status: 'Inativo', cnpj: '45.678.901/0001-23'
-- Ricardo Gomes: role: 'Representante', status: 'Ativo', cnpj: '56.789.012/0001-34'
-- João Santos: role: 'Representante', status: 'Pendente de Aprovação', cnpj: '67.890.123/0001-45'
-- Maria Oliveira: role: 'Representante', status: 'Pendente de Aprovação', cnpj: '78.901.234/0001-56'
-- Admin Principal: role: 'Administrador', status: 'Ativo'
-- Suporte Técnico: role: 'Suporte', status: 'Ativo'

-- Create a function to generate sample contracts after profiles are created
CREATE OR REPLACE FUNCTION create_sample_contracts()
RETURNS void AS $$
DECLARE
    rep_id UUID;
    client_id INTEGER;
    commission_table_id INTEGER;
BEGIN
    -- Get first representative ID (will be created via app)
    SELECT id INTO rep_id FROM public.profiles WHERE role = 'Representante' LIMIT 1;
    
    -- Only create contracts if we have representatives
    IF rep_id IS NOT NULL THEN
        -- Get client and commission table IDs
        SELECT id INTO client_id FROM public.clients WHERE full_name = 'João Silva';
        SELECT id INTO commission_table_id FROM public.commission_tables WHERE name = 'Tabela A - Premium';
        
        -- Insert sample contracts
        INSERT INTO public.contracts (contract_code, client_id, representative_id, commission_table_id, total_value, remaining_value, total_installments, paid_installments, status) VALUES
        ('PV-2025-001', client_id, rep_id, commission_table_id, 45000.00, 38250.00, 80, 12, 'Ativo'),
        ('PV-2025-002', (SELECT id FROM public.clients WHERE full_name = 'Maria Santos'), rep_id, (SELECT id FROM public.commission_tables WHERE name = 'Tabela B - Padrão'), 38500.00, 34650.00, 80, 8, 'Aprovado'),
        ('PV-2025-003', (SELECT id FROM public.clients WHERE full_name = 'Pedro Costa'), rep_id, commission_table_id, 52000.00, 42250.00, 80, 15, 'Em Análise'),
        ('PV-2025-004', (SELECT id FROM public.clients WHERE full_name = 'Lucia Ferreira'), rep_id, (SELECT id FROM public.commission_tables WHERE name = 'Tabela C - Flexível'), 41200.00, 35020.00, 80, 10, 'Pendente'),
        ('PV-2025-005', (SELECT id FROM public.clients WHERE full_name = 'Roberto Alves'), rep_id, (SELECT id FROM public.commission_tables WHERE name = 'Tabela D - Básica'), 36800.00, 31280.00, 80, 9, 'Aprovado')
        ON CONFLICT (contract_code) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create sample invoices function
CREATE OR REPLACE FUNCTION create_sample_invoices()
RETURNS void AS $$
DECLARE
    contract_id INTEGER;
BEGIN
    -- Get first contract ID
    SELECT id INTO contract_id FROM public.contracts WHERE contract_code = 'PV-2025-001';
    
    IF contract_id IS NOT NULL THEN
        INSERT INTO public.invoices (invoice_code, contract_id, value, due_date, status, payment_link_boleto, payment_link_pix) VALUES
        ('INV-2025-001', contract_id, 562.50, '2025-02-15', 'Pendente', 'https://boleto.example.com/001', 'https://pix.example.com/001'),
        ('INV-2025-002', contract_id, 562.50, '2025-03-15', 'Pendente', 'https://boleto.example.com/002', 'https://pix.example.com/002')
        ON CONFLICT (invoice_code) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;
