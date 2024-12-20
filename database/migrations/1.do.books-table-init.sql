CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE SCHEMA IF NOT EXISTS server;

CREATE TABLE server.book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_long TEXT,
    isbn TEXT UNIQUE,
    isbn13 TEXT,
    dewey_decimal TEXT,
    binding TEXT,
    publisher TEXT,
    language language DEFAULT 'other',
    date_published TIMESTAMPTZ,
    edition TEXT,
    pages INT,
    overview TEXT,
    image TEXT,
    excerpt TEXT,
    synopsis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE UNIQUE INDEX unique_book_isbn_idx ON server.book (isbn);