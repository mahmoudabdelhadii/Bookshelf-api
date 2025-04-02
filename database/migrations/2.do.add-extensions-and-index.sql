CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX books_title_trgm_idx ON server.book USING GIN (title gin_trgm_ops);

ALTER TABLE server.book
ADD COLUMN title_tsv tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '')) || 
  to_tsvector('arabic', coalesce(title, '')) ||
  to_tsvector('simple', coalesce(title, ''))
) STORED;

ALTER TABLE server.book
ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(overview, '')), 'B') ||
  setweight(to_tsvector('arabic', coalesce(overview, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(overview, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('arabic', coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(synopsis, '')), 'D') ||
  setweight(to_tsvector('arabic', coalesce(synopsis, '')), 'D') ||
  setweight(to_tsvector('simple', coalesce(synopsis, '')), 'D')
) STORED;

CREATE INDEX books_title_tsv_idx ON server.book USING GIN (title_tsv);
CREATE INDEX books_search_idx ON server.book USING GIN (search_tsv);