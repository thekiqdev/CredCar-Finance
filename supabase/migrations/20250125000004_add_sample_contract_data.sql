-- Add sample commission tables data
INSERT INTO commission_tables (name, commission_percentage, payment_details) VALUES
('Tabela A', 5.0, 'Pagamento integral (1 parcela)'),
('Tabela B', 4.5, 'Pagamento dividido em 2 parcelas'),
('Tabela C', 4.0, 'Pagamento dividido em 3 parcelas'),
('Tabela D', 3.5, 'Pagamento dividido em 4 parcelas')
ON CONFLICT (name) DO UPDATE SET
  payment_details = EXCLUDED.payment_details;

-- Add sample groups
INSERT INTO groups (name, description) VALUES
('Grupo Premium', 'Grupo para representantes premium com maior volume de vendas'),
('Grupo Padrão', 'Grupo padrão para novos representantes'),
('Grupo Executivo', 'Grupo para representantes executivos')
ON CONFLICT (name) DO NOTHING;

-- Add sample quotas for each group
DO $$
DECLARE
    group_record RECORD;
    i INTEGER;
BEGIN
    FOR group_record IN SELECT id, name FROM groups LOOP
        -- Create 20 quotas for each group
        FOR i IN 1..20 LOOP
            INSERT INTO quotas (group_id, quota_number, status)
            VALUES (group_record.id, i, 'Disponível')
            ON CONFLICT (group_id, quota_number) DO NOTHING;
        END LOOP;
        
        -- Make some quotas occupied for demo purposes
        IF group_record.name = 'Grupo Premium' THEN
            UPDATE quotas SET status = 'Ocupada' WHERE group_id = group_record.id AND quota_number IN (1, 3, 5, 7);
        ELSIF group_record.name = 'Grupo Padrão' THEN
            UPDATE quotas SET status = 'Ocupada' WHERE group_id = group_record.id AND quota_number IN (2, 4, 6);
            UPDATE quotas SET status = 'Cancelada/Atraso' WHERE group_id = group_record.id AND quota_number IN (8, 10);
        END IF;
    END LOOP;
END $$;