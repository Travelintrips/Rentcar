-- Drop the table from the publication first to avoid the error
ALTER PUBLICATION supabase_realtime DROP TABLE bookings;

-- Add the tenant_type column to the bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_type TEXT;

-- Re-add the table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;