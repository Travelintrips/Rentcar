-- Create staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nickname TEXT,
  ktp_address TEXT,
  relative_phone TEXT,
  ktp_number TEXT,
  sim_number TEXT,
  selfie_url TEXT,
  kk_url TEXT,
  ktp_url TEXT,
  skck_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policy for staff table
DROP POLICY IF EXISTS "Staff can view their own data" ON staff;
CREATE POLICY "Staff can view their own data"
  ON staff
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can update their own data" ON staff;
CREATE POLICY "Staff can update their own data"
  ON staff
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all staff data" ON staff;
CREATE POLICY "Admins can view all staff data"
  ON staff
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'Admin');

-- Create staff storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff', 'staff', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on staff bucket
UPDATE storage.buckets SET public = true WHERE id = 'staff';

-- Create policy for staff bucket
DROP POLICY IF EXISTS "Staff can upload their own files" ON storage.objects;
CREATE POLICY "Staff can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'staff' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Staff can update their own files" ON storage.objects;
CREATE POLICY "Staff can update their own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'staff' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Staff can read their own files" ON storage.objects;
CREATE POLICY "Staff can read their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Staff can delete their own files" ON storage.objects;
CREATE POLICY "Staff can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'staff' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add staff table to realtime publication
alter publication supabase_realtime add table staff;
