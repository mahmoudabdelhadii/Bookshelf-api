CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE SCHEMA IF NOT EXISTS server;

CREATE TABLE server.book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    published_year INTEGER,
    isbn TEXT UNIQUE,
    genre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);


CREATE UNIQUE INDEX unique_book_isbn_idx ON server.book (isbn);