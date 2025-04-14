-- Add location tracking columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- The users table is already part of the realtime publication
-- No need to add it again

-- Create policy to allow users to update their own location
DROP POLICY IF EXISTS "Users can update their own location" ON public.users;
CREATE POLICY "Users can update their own location"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy to allow admins to view all user locations
DROP POLICY IF EXISTS "Admins can view all user locations" ON public.users;
CREATE POLICY "Admins can view all user locations"
  ON public.users
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'Admin');
