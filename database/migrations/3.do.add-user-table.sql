
CREATE TABLE server."user" (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


CREATE UNIQUE INDEX "unique_email" ON server."user"(email);
CREATE UNIQUE INDEX "unique_username" ON server."user"(username);



CREATE TYPE server.role AS ENUM ('user', 'admin');

ALTER TABLE server."user" 
ADD COLUMN "role" server.role NOT NULL DEFAULT 'user';
