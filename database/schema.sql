-- Clean up existing database objects

DROP TABLE IF EXISTS users;

-- Create database objects

CREATE EXTENSION "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    display_name TEXT,
    pw_hash TEXT
);


