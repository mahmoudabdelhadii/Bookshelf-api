-- Remove added columns from library table

-- Drop trigger and function first
DROP TRIGGER IF EXISTS library_updated_at_trigger ON server."library";
DROP FUNCTION IF EXISTS update_library_updated_at();

-- Remove the added columns
ALTER TABLE server."library"
DROP COLUMN IF EXISTS "description",
DROP COLUMN IF EXISTS "address",
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "email",
DROP COLUMN IF EXISTS "website",
DROP COLUMN IF EXISTS "hours",
DROP COLUMN IF EXISTS "image",
DROP COLUMN IF EXISTS "rating",
DROP COLUMN IF EXISTS "owner_id",
DROP COLUMN IF EXISTS "updated_at";