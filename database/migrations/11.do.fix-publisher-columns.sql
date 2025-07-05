-- Migration 11: Add missing columns to publisher table
-- Add missing columns that are in the Drizzle schema but not in the database

-- Add missing columns to publisher table
ALTER TABLE server."publisher" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "founded_year" INTEGER,
ADD COLUMN IF NOT EXISTS "books_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger for updating updated_at on publisher table
CREATE TRIGGER update_publisher_updated_at
    BEFORE UPDATE ON server."publisher"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN server."publisher"."address" IS 'Publisher address';
COMMENT ON COLUMN server."publisher"."website" IS 'Publisher website URL';
COMMENT ON COLUMN server."publisher"."founded_year" IS 'Year the publisher was founded';
COMMENT ON COLUMN server."publisher"."books_count" IS 'Count of books by this publisher';