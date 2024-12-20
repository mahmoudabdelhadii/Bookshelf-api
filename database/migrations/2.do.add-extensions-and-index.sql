
CREATE EXTENSION IF NOT EXISTS pg_trgm;


CREATE INDEX books_title_trgm_idx ON server.book USING GIN (title gin_trgm_ops);


ALTER TABLE server.book
ADD COLUMN title_tsv tsvector GENERATED ALWAYS AS (
  to_tsvector('english', title) || to_tsvector('arabic', title)
) STORED;

ALTER TABLE server.book
ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('arabic', title), 'A') ||
  setweight(to_tsvector('english', description), 'B') ||
  setweight(to_tsvector('arabic', description), 'B')
) STORED;

CREATE INDEX books_title_tsv_idx ON server.book USING GIN (title_tsv);
CREATE INDEX books_search_idx ON server.book USING GIN (search_tsv);