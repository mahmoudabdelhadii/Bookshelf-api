CREATE TABLE IF NOT EXISTS server.author (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS server.publisher (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS server.subject (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent TEXT,
  UNIQUE(name)
);