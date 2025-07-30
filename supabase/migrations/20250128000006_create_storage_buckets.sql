-- Create storage buckets for file uploads

-- Create contract-documents bucket for contract-related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-documents',
  'contract-documents', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create signatures bucket for signature images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  true, 
  2097152, -- 2MB limit for signatures
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create representative-documents bucket for representative document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'representative-documents',
  'representative-documents',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Enable realtime for storage operations (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;

-- Create basic RLS policies for public access (temporary - should be restricted later)
-- Note: These are permissive policies for initial testing
-- TODO: Implement proper RLS policies based on user roles and ownership

-- Policy for contract-documents bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'contract-documents');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contract-documents');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'contract-documents');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'contract-documents');

-- Policy for signatures bucket  
CREATE POLICY "Signatures Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Signatures Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "Signatures Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'signatures');
CREATE POLICY "Signatures Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'signatures');

-- Policy for representative-documents bucket
CREATE POLICY "Rep Docs Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'representative-documents');
CREATE POLICY "Rep Docs Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'representative-documents');
CREATE POLICY "Rep Docs Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'representative-documents');
CREATE POLICY "Rep Docs Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'representative-documents');
