-- Create users_locations table to track user locations
CREATE TABLE IF NOT EXISTS users_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  full_name TEXT,
  latitude FLOAT,
  longitude FLOAT,
  device_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users_locations;
  END IF;
END
$$;

-- Create policies for the users_locations table
-- Allow authenticated users to insert their own location
DROP POLICY IF EXISTS "Users can insert their own location" ON users_locations;
CREATE POLICY "Users can insert their own location"
ON users_locations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own location
DROP POLICY IF EXISTS "Users can update their own location" ON users_locations;
CREATE POLICY "Users can update their own location"
ON users_locations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to read all locations
DROP POLICY IF EXISTS "Admins can read all locations" ON users_locations;
CREATE POLICY "Admins can read all locations"
ON users_locations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Admin'
  )
  OR auth.uid() = user_id
);

-- Enable Row Level Security
ALTER TABLE users_locations ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_locations_user_id ON users_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_users_locations_updated_at ON users_locations(updated_at);
