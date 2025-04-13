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
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add default roles if they don't exist
INSERT INTO public.roles (name, role_name) 
VALUES 
  ('Admin', 'Admin'),
  ('Manager', 'Manager'),
  ('Staff', 'Staff'),
  ('Customer', 'Customer'),
  ('Driver', 'Driver'),
  ('Driver Mitra', 'DriverMitra'),
  ('Driver Perusahaan', 'DriverPerusahaan'),
  ('HRD', 'HRD'),
  ('Supervisor', 'Supervisor')
ON CONFLICT (role_name) DO NOTHING;
