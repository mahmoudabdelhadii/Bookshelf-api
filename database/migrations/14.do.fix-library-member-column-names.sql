-- Fix column name mismatch in library_member table
-- The Drizzle schema expects 'join_date' but the database has 'joined_at'

ALTER TABLE server."library_member" 
RENAME COLUMN "joined_at" TO "join_date";