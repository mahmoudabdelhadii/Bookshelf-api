-- Add quantity field to library_books table
ALTER TABLE server."library_books" 
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;