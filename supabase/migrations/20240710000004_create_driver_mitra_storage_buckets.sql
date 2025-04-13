-- Create the driver_mitra_documents bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'driver_mitra_documents') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('driver_mitra_documents', 'driver_mitra_documents', false);
    END IF;
END
$$;

-- Create the driver_mitra_vehicles bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'driver_mitra_vehicles') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('driver_mitra_vehicles', 'driver_mitra_vehicles', false);
    END IF;
END
$$;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Public access to drivers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Individual user access to driver_mitra_documents" ON storage.objects;
DROP POLICY IF EXISTS "Individual user access to driver_mitra_vehicles" ON storage.objects;

-- Create policies for the driver_mitra_documents bucket
CREATE POLICY "Individual user access to driver_mitra_documents"
ON storage.objects FOR ALL
USING (bucket_id = 'driver_mitra_documents' AND (auth.uid() = owner OR auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin')))
WITH CHECK (bucket_id = 'driver_mitra_documents' AND (auth.uid() = owner OR auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin')));

-- Create policies for the driver_mitra_vehicles bucket
CREATE POLICY "Individual user access to driver_mitra_vehicles"
ON storage.objects FOR ALL
USING (bucket_id = 'driver_mitra_vehicles' AND (auth.uid() = owner OR auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin')))
WITH CHECK (bucket_id = 'driver_mitra_vehicles' AND (auth.uid() = owner OR auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin')));