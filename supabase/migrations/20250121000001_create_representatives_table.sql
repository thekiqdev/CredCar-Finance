-- Create representatives table
CREATE TABLE IF NOT EXISTS public.representatives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  cnpj text,
  razao_social text,
  ponto_venda text,
  commission_code text UNIQUE,
  password_hash text NOT NULL,
  status text DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Pendente de Aprovação', 'Documentos Pendentes', 'Pausado', 'Cancelado')),

  total_sales numeric DEFAULT 0,
  contracts_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_representatives_updated_at BEFORE UPDATE ON public.representatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate commission code
CREATE OR REPLACE FUNCTION generate_commission_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.commission_code IS NULL THEN
        NEW.commission_code = LPAD((SELECT COALESCE(MAX(CAST(commission_code AS INTEGER)), 0) + 1 FROM public.representatives WHERE commission_code ~ '^[0-9]+$')::text, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically generate commission code
CREATE TRIGGER generate_representatives_commission_code BEFORE INSERT ON public.representatives
    FOR EACH ROW EXECUTE FUNCTION generate_commission_code();

-- Enable realtime
alter publication supabase_realtime add table representatives;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_representatives_email ON public.representatives(email);
CREATE INDEX IF NOT EXISTS idx_representatives_commission_code ON public.representatives(commission_code);
CREATE INDEX IF NOT EXISTS idx_representatives_status ON public.representatives(status);
