-- Fix missing columns across multiple tables
-- Note: Author and Publisher columns were already added in migrations 10 and 11

-- 1. Add missing columns to subject table
ALTER TABLE server."subject"
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "books_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add trigger to update updated_at timestamp for subject
CREATE OR REPLACE FUNCTION update_subject_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subject_updated_at_trigger
    BEFORE UPDATE ON server."subject"
    FOR EACH ROW
    EXECUTE FUNCTION update_subject_updated_at();

-- 2. Add missing permissions column to library_member table
ALTER TABLE server."library_member"
ADD COLUMN IF NOT EXISTS "permissions" TEXT[];

-- 3. Add missing approved_by column to borrow_request table
ALTER TABLE server."borrow_request"
ADD COLUMN IF NOT EXISTS "approved_by" UUID REFERENCES server."user"("id") ON DELETE SET NULL;