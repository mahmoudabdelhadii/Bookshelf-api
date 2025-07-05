-- Add missing columns to library table to match the TypeScript model

ALTER TABLE server."library"
ADD COLUMN "description" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "hours" TEXT,
ADD COLUMN "image" TEXT,
ADD COLUMN "rating" DECIMAL(2,1) CHECK ("rating" >= 0 AND "rating" <= 5),
ADD COLUMN "owner_id" UUID REFERENCES server."user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update the existing libraries to have a default owner_id (you may need to adjust this)
-- UPDATE server."library" SET "owner_id" = (SELECT "id" FROM server."user" LIMIT 1) WHERE "owner_id" IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_updated_at_trigger
    BEFORE UPDATE ON server."library"
    FOR EACH ROW
    EXECUTE FUNCTION update_library_updated_at();