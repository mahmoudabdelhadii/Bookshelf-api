CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX books_title_trgm_idx ON books USING GIN (title gin_trgm_ops);

ALTER TABLE books ADD COLUMN title_tsv tsvector;
UPDATE books SET title_tsv = to_tsvector('simple', title);
CREATE INDEX books_title_tsv_idx ON books USING GIN (title_tsv);