-- Create a trigger to ensure status and available fields are in sync
CREATE OR REPLACE FUNCTION sync_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being updated, update available field accordingly
  IF NEW.status = 'available' THEN
    NEW.available = TRUE;
  ELSIF NEW.status = 'maintenance' OR NEW.status = 'suspended' OR NEW.status = 'rented' OR NEW.status = 'booked' OR NEW.status = 'onride' THEN
    NEW.available = FALSE;
  END IF;
  
  -- If is_active is being updated, update status field accordingly
  IF NEW.is_active = FALSE AND NEW.status != 'suspended' THEN
    NEW.status = 'suspended';
  ELSIF NEW.is_active = TRUE AND NEW.status = 'suspended' THEN
    NEW.status = 'available';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_vehicle_status_trigger ON vehicles;

-- Create the trigger
CREATE TRIGGER sync_vehicle_status_trigger
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION sync_vehicle_status();

-- Add the vehicles table to the realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
  END IF;
END
$$;