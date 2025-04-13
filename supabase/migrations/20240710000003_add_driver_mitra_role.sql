-- Create the driver_mitra role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'driver_mitra') THEN
        CREATE ROLE driver_mitra;
    END IF;
END
$$;

-- Add the role to the realtime publication only if it's not already a member
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'roles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE roles;
    END IF;
END
$$;