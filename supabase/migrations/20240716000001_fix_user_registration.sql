-- Fix user registration issues by ensuring proper table constraints

-- Make sure the auth.users table has the correct constraints
ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Ensure the public.users table has the correct foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure the role_id column in users table accepts NULL values
ALTER TABLE public.users ALTER COLUMN role_id DROP NOT NULL;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_id_idx ON public.users (role_id);

-- Make sure the roles table exists and has the correct structure
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add default roles if they don't exist
INSERT INTO public.roles (role_name) 
VALUES 
  ('Admin'),
  ('Manager'),
  ('Staff'),
  ('Customer'),
  ('Driver'),
  ('DriverMitra'),
  ('DriverPerusahaan')
ON CONFLICT (role_name) DO NOTHING;

-- Enable row-level security on the roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create policy for roles table
DROP POLICY IF EXISTS "Public read access" ON public.roles;
CREATE POLICY "Public read access"
  ON public.roles FOR SELECT
  USING (true);

-- Add the roles table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
