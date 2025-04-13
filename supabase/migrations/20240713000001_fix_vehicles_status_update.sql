-- Ensure status column is properly typed as text
ALTER TABLE vehicles 
ALTER COLUMN status TYPE text,
ALTER COLUMN available TYPE boolean USING available::boolean;

-- No need to add to publication as it's already there
-- The error was: relation "vehicles" is already member of publication "supabase_realtime"
