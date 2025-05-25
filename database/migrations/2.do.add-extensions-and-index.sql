CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS books_title_trgm_idx ON server.book
USING GIN (title gin_trgm_ops);

-- Wrap the entire expression in extra parentheses for CREATE INDEX
CREATE INDEX IF NOT EXISTS books_title_tsv_idx ON server.book
USING GIN (
  (
    to_tsvector('english', COALESCE(title, '')) ||
    to_tsvector('arabic', COALESCE(title, '')) ||
    to_tsvector('simple', COALESCE(title, ''))
  )
);

CREATE INDEX IF NOT EXISTS books_search_idx ON server.book
USING GIN (
  (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||

    setweight(to_tsvector('english', COALESCE(overview, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(overview, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(overview, '')), 'B') ||

    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(excerpt, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'C') ||

    setweight(to_tsvector('english', COALESCE(synopsis, '')), 'D') ||
    setweight(to_tsvector('arabic', COALESCE(synopsis, '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(synopsis, '')), 'D')
  )
);