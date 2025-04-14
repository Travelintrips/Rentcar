-- Add unique constraint on user_id if it doesn't exist already
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_locations_user_id_key') THEN
    ALTER TABLE users_locations ADD CONSTRAINT users_locations_user_id_key UNIQUE (user_id);
  END IF;
END $$;
