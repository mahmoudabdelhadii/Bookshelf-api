CREATE EXTENSION IF NOT EXISTS pg_trgm;


CREATE INDEX books_title_trgm_idx ON server.book
USING GIN (title gin_trgm_ops);


CREATE INDEX books_title_tsv_idx ON server.book
USING GIN (
  to_tsvector('english', title) || to_tsvector('arabic', title)
);


CREATE INDEX books_search_idx ON server.book
USING GIN (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('arabic', title), 'A') ||
  setweight(to_tsvector('english', overview), 'B') ||
  setweight(to_tsvector('arabic', overview), 'B')
);