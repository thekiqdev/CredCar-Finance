-- First, let's check if invoices table exists and add missing columns
DO $$ 
BEGIN
  -- Add installment_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'installment_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN installment_number INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  -- Add invoice_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(50) UNIQUE;
  END IF;
  
  -- Add amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN amount DECIMAL(15,2) NOT NULL DEFAULT 0;
  END IF;
  
  -- Add due_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days';
  END IF;
  
  -- Add payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_date DATE;
  END IF;
  
  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_method VARCHAR(50);
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'notes'
  ) THEN
    ALTER TABLE invoices ADD COLUMN notes TEXT;
  END IF;
  
  -- Add contract_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE;
  END IF;
  
  -- Make invoice_code nullable if it exists and is not null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_code' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN invoice_code DROP NOT NULL;
  END IF;
  
  -- Make value nullable if it exists and is not null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'value' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN value DROP NOT NULL;
  END IF;
END $$;

-- Create anticipations table for early payments (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'anticipations') THEN
    CREATE TABLE anticipations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      anticipation_number VARCHAR(50) UNIQUE NOT NULL,
      installments_count INTEGER NOT NULL,
      original_amount DECIMAL(15,2) NOT NULL,
      discount_percentage DECIMAL(5,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      final_amount DECIMAL(15,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
      payment_date DATE,
      payment_method VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_anticipations_contract_id ON anticipations(contract_id);
CREATE INDEX IF NOT EXISTS idx_anticipations_status ON anticipations(status);

-- Enable realtime for both tables (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'anticipations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE anticipations;
  END IF;
END $$;

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  result_invoice_number TEXT;
BEGIN
  -- Get the next invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(i.invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices i
  WHERE i.invoice_number ~ '^FAT-[0-9]+$' AND i.invoice_number IS NOT NULL;
  
  -- Format the invoice number
  result_invoice_number := 'FAT-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN result_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate anticipation numbers
CREATE OR REPLACE FUNCTION generate_anticipation_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  result_anticipation_number TEXT;
BEGIN
  -- Get the next anticipation number
  SELECT COALESCE(MAX(CAST(SUBSTRING(a.anticipation_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM anticipations a
  WHERE a.anticipation_number ~ '^ANT-[0-9]+$';
  
  -- Format the anticipation number
  result_anticipation_number := 'ANT-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN result_anticipation_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Create trigger to auto-generate anticipation numbers
CREATE OR REPLACE FUNCTION set_anticipation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anticipation_number IS NULL OR NEW.anticipation_number = '' THEN
    NEW.anticipation_number := generate_anticipation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_anticipation_number ON anticipations;
CREATE TRIGGER trigger_set_anticipation_number
  BEFORE INSERT ON anticipations
  FOR EACH ROW
  EXECUTE FUNCTION set_anticipation_number();

-- Update existing invoices to have invoice numbers if they don't have them
UPDATE invoices 
SET invoice_number = generate_invoice_number()
WHERE invoice_number IS NULL OR invoice_number = '';

-- Insert sample data for demonstration (only if we have contracts and few invoices)
DO $$
DECLARE
  has_invoice_code BOOLEAN;
  has_value BOOLEAN;
  sample_amount DECIMAL;
BEGIN
  IF EXISTS (SELECT 1 FROM contracts WHERE status IN ('Aprovado', 'Ativo')) 
     AND (SELECT COUNT(*) FROM invoices) < 5 THEN
    
    -- Check which columns exist
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'invoice_code'
    ) INTO has_invoice_code;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'value'
    ) INTO has_value;
    
    -- Insert based on available columns
    FOR sample_amount IN 
      SELECT 
        CASE 
          WHEN c.credit_amount IS NOT NULL THEN CAST(c.credit_amount AS DECIMAL) / 80
          WHEN c.total_value IS NOT NULL THEN CAST(c.total_value AS DECIMAL) / 80
          ELSE 500.00
        END
      FROM contracts c
      WHERE c.status IN ('Aprovado', 'Ativo')
      AND NOT EXISTS (SELECT 1 FROM invoices WHERE contract_id = c.id)
      LIMIT 3
    LOOP
      IF has_invoice_code AND has_value THEN
        INSERT INTO invoices (contract_id, installment_number, amount, due_date, status, invoice_code, value)
        SELECT 
          c.id,
          1,
          sample_amount,
          CURRENT_DATE + INTERVAL '30 days',
          'pending',
          'FAT-' || LPAD((COALESCE((SELECT MAX(id) FROM invoices), 0) + 1)::TEXT, 6, '0'),
          sample_amount
        FROM contracts c
        WHERE c.status IN ('Aprovado', 'Ativo')
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE contract_id = c.id)
        LIMIT 1;
      ELSIF has_invoice_code THEN
        INSERT INTO invoices (contract_id, installment_number, amount, due_date, status, invoice_code)
        SELECT 
          c.id,
          1,
          sample_amount,
          CURRENT_DATE + INTERVAL '30 days',
          'pending',
          'FAT-' || LPAD((COALESCE((SELECT MAX(id) FROM invoices), 0) + 1)::TEXT, 6, '0')
        FROM contracts c
        WHERE c.status IN ('Aprovado', 'Ativo')
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE contract_id = c.id)
        LIMIT 1;
      ELSIF has_value THEN
        INSERT INTO invoices (contract_id, installment_number, amount, due_date, status, value)
        SELECT 
          c.id,
          1,
          sample_amount,
          CURRENT_DATE + INTERVAL '30 days',
          'pending',
          sample_amount
        FROM contracts c
        WHERE c.status IN ('Aprovado', 'Ativo')
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE contract_id = c.id)
        LIMIT 1;
      ELSE
        INSERT INTO invoices (contract_id, installment_number, amount, due_date, status)
        SELECT 
          c.id,
          1,
          sample_amount,
          CURRENT_DATE + INTERVAL '30 days',
          'pending'
        FROM contracts c
        WHERE c.status IN ('Aprovado', 'Ativo')
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE contract_id = c.id)
        LIMIT 1;
      END IF;
    END LOOP;
  END IF;
END $$;