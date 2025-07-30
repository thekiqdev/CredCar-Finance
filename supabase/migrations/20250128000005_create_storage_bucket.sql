-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public uploads to contract-documents bucket
CREATE POLICY "Allow public uploads to contract-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-documents');

-- Create policy to allow public access to contract-documents bucket
CREATE POLICY "Allow public access to contract-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents');

-- Create policy to allow public updates to contract-documents bucket
CREATE POLICY "Allow public updates to contract-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'contract-documents');

-- Create policy to allow public deletes from contract-documents bucket
CREATE POLICY "Allow public deletes from contract-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'contract-documents');
