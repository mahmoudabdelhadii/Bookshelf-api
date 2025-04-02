CREATE TABLE server."library" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "location" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE server."library_books" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "library_id" UUID NOT NULL REFERENCES server."library"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "book_id" UUID NOT NULL REFERENCES server."book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "shelf_location" TEXT,
  "condition" TEXT,
  "added_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);