-- Migration 10: Fix author and book table columns
-- Add missing columns to author table and fix book published year

-- Add missing columns to author table
ALTER TABLE server."author" 
ADD COLUMN IF NOT EXISTS "biography" TEXT,
ADD COLUMN IF NOT EXISTS "birth_date" TEXT,
ADD COLUMN IF NOT EXISTS "nationality" TEXT,
ADD COLUMN IF NOT EXISTS "books_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop the old date_published column and add published_year as integer
ALTER TABLE server."book" 
DROP COLUMN IF EXISTS "date_published",
ADD COLUMN "published_year" INTEGER;

-- Create trigger for updating updated_at on author table
CREATE TRIGGER update_author_updated_at
    BEFORE UPDATE ON server."author"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN server."author"."biography" IS 'Author biography text';
COMMENT ON COLUMN server."author"."birth_date" IS 'Author birth date as text';
COMMENT ON COLUMN server."author"."nationality" IS 'Author nationality';
COMMENT ON COLUMN server."author"."books_count" IS 'Count of books by this author';
COMMENT ON COLUMN server."book"."published_year" IS 'Year the book was published as integer';