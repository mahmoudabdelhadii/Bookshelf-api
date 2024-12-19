
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


CREATE UNIQUE INDEX "unique_email" ON "user"(email);
CREATE UNIQUE INDEX "unique_username" ON "user"(username);


ALTER TABLE "books" RENAME TO "book";