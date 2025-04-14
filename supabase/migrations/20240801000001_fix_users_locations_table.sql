-- Add a unique constraint to the users_locations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_locations_user_id_key'
  ) THEN
    ALTER TABLE users_locations ADD CONSTRAINT users_locations_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users_locations;
