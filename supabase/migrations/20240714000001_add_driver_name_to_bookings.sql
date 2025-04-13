-- First, drop the table from the publication
ALTER PUBLICATION supabase_realtime DROP TABLE bookings;

-- Add the driver_name column to the bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_name TEXT;

-- Re-add the table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;