-- Status para o perfil de um representante ou colaborador
CREATE TYPE user_status AS ENUM ('Ativo', 'Inativo', 'Pendente de Aprovação', 'Documentos Pendentes', 'Pausado', 'Cancelado');

-- Níveis de acesso para usuários internos (colaboradores)
CREATE TYPE user_role AS ENUM ('Administrador', 'Suporte');

-- Status para os documentos enviados pelos representantes
CREATE TYPE document_status AS ENUM ('Pendente', 'Aprovado', 'Reprovado');

-- Status para os contratos
CREATE TYPE contract_status AS ENUM ('Ativo', 'Concluído', 'Faturado', 'Cancelado', 'Pendente', 'Em Análise', 'Em Atraso', 'Aprovado', 'Reprovado');

-- Status para as solicitações de retirada de comissão
CREATE TYPE withdrawal_status AS ENUM ('Pendente', 'Aprovado', 'Rejeitado');

-- Tabela profiles (Perfis de Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'Pendente de Aprovação',
  cnpj TEXT,
  company_name TEXT,
  point_of_sale TEXT,
  commission_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela commission_tables (Tabelas de Comissão)
CREATE TABLE IF NOT EXISTS public.commission_tables (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  commission_percentage NUMERIC(5, 2) NOT NULL,
  payment_installments INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela clients (Clientes)
CREATE TABLE IF NOT EXISTS public.clients (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela contracts (Contratos)
CREATE TABLE IF NOT EXISTS public.contracts (
  id SERIAL PRIMARY KEY,
  contract_code TEXT UNIQUE NOT NULL,
  client_id INT NOT NULL REFERENCES public.clients(id),
  representative_id UUID NOT NULL REFERENCES public.profiles(id),
  commission_table_id INT NOT NULL REFERENCES public.commission_tables(id),
  total_value NUMERIC(12, 2) NOT NULL,
  remaining_value NUMERIC(12, 2) NOT NULL,
  total_installments INT NOT NULL DEFAULT 80,
  paid_installments INT NOT NULL DEFAULT 0,
  status contract_status NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela representative_documents (Documentos dos Representantes)
CREATE TABLE IF NOT EXISTS public.representative_documents (
  id SERIAL PRIMARY KEY,
  representative_id UUID NOT NULL REFERENCES public.profiles(id),
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'Pendente',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela withdrawal_requests (Solicitações de Retirada)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id SERIAL PRIMARY KEY,
  request_code TEXT UNIQUE NOT NULL,
  representative_id UUID NOT NULL REFERENCES public.profiles(id),
  requested_value NUMERIC(10, 2) NOT NULL,
  invoice_url TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'Pendente',
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Tabela invoices (Faturas)
CREATE TABLE IF NOT EXISTS public.invoices (
  id SERIAL PRIMARY KEY,
  invoice_code TEXT UNIQUE NOT NULL,
  contract_id INT NOT NULL REFERENCES public.contracts(id),
  value NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_link_boleto TEXT,
  payment_link_pix TEXT
);

-- Enable realtime for all tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table commission_tables;
alter publication supabase_realtime add table clients;
alter publication supabase_realtime add table contracts;
alter publication supabase_realtime add table representative_documents;
alter publication supabase_realtime add table withdrawal_requests;
alter publication supabase_realtime add table invoices;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_contracts_representative_id ON public.contracts(representative_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_representative_documents_representative_id ON public.representative_documents(representative_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_representative_id ON public.withdrawal_requests(representative_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON public.invoices(contract_id);

-- Insert sample commission tables
INSERT INTO public.commission_tables (name, description, commission_percentage, payment_installments) VALUES
('Tabela A', 'Comissão padrão para representantes experientes', 4.00, 1),
('Tabela B', 'Comissão intermediária', 3.50, 2),
('Tabela C', 'Comissão para novos representantes', 3.00, 3),
('Tabela D', 'Comissão básica', 2.50, 4)
ON CONFLICT DO NOTHING;