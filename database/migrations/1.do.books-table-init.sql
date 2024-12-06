CREATE SCHEMA IF NOT EXIST server;

CREATE TABLE server.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    published_year INTEGER,
    isbn TEXT UNIQUE,
    genre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);


CREATE UNIQUE INDEX unique_book_isbn_idx ON server.books (isbn);