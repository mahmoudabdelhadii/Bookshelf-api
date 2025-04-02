CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE SCHEMA IF NOT EXISTS server;

-- Create ENUM type for language
CREATE TYPE server.language AS ENUM ('en', 'ar', 'other');

-- Create `author` table
CREATE TABLE IF NOT EXISTS server.author (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create `publisher` table
CREATE TABLE IF NOT EXISTS server.publisher (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create `subject` table
CREATE TABLE IF NOT EXISTS server.subject (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  parent UUID REFERENCES server.subject(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create `book` table with foreign keys and constraints inline
CREATE TABLE IF NOT EXISTS server.book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_long TEXT,
    isbn TEXT UNIQUE,
    isbn13 TEXT,
    dewey_decimal TEXT,
    binding TEXT,
    language server.language NOT NULL DEFAULT 'other',
    author_id UUID NOT NULL REFERENCES server.author(id) ON DELETE CASCADE,
    publisher_id UUID NOT NULL REFERENCES server.publisher(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES server.subject(id) ON DELETE SET NULL,
    date_published TIMESTAMPTZ,
    edition TEXT,
    pages INT,
    overview TEXT,
    image TEXT,
    excerpt TEXT,
    synopsis TEXT,
    genre TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_book_isbn_idx ON server.book (isbn);