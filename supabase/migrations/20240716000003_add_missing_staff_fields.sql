-- Add missing fields to users table for staff registration

-- Add missing fields to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS ktp_address TEXT,
ADD COLUMN IF NOT EXISTS relative_phone TEXT,
ADD COLUMN IF NOT EXISTS ktp_number TEXT,
ADD COLUMN IF NOT EXISTS sim_number TEXT,
ADD COLUMN IF NOT EXISTS sim_expiry DATE,
ADD COLUMN IF NOT EXISTS kk_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_url TEXT,
ADD COLUMN IF NOT EXISTS skck_url TEXT,
ADD COLUMN IF NOT EXISTS sim_url TEXT;

-- Create staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  nickname TEXT,
  ktp_address TEXT,
  relative_phone TEXT,
  ktp_number TEXT,
  sim_number TEXT,
  selfie_url TEXT,
  kk_url TEXT,
  ktp_url TEXT,
  skck_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policy for staff table
DROP POLICY IF EXISTS "Staff can view their own data" ON public.staff;
CREATE POLICY "Staff can view their own data"
  ON public.staff FOR SELECT
  USING (auth.uid() = id);

-- Create policy for admins to manage staff
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff"
  ON public.staff
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role_id IN (SELECT id FROM public.roles WHERE role_name = 'Admin')
    )
  );

-- Add realtime for staff table
alter publication supabase_realtime add table public.staff;
