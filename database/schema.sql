-- Clean up existing database objects

DROP TABLE IF EXISTS player;


-- Create database objects

CREATE EXTENSION "uuid-ossp";

CREATE TABLE IF NOT EXISTS player (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
);

