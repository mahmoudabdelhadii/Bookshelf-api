-- Undo missing columns fixes

-- Drop triggers and functions
DROP TRIGGER IF EXISTS subject_updated_at_trigger ON server."subject";
DROP FUNCTION IF EXISTS update_subject_updated_at();

-- Remove added columns from subject table
ALTER TABLE server."subject"
DROP COLUMN IF EXISTS "description",
DROP COLUMN IF EXISTS "books_count",
DROP COLUMN IF EXISTS "updated_at";

-- Remove added column from library_member table
ALTER TABLE server."library_member"
DROP COLUMN IF EXISTS "permissions";

-- Remove added column from borrow_request table
ALTER TABLE server."borrow_request"
DROP COLUMN IF EXISTS "approved_by";