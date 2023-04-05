-- Clean up existing database objects

DROP TABLE IF EXISTS game_link;
DROP TABLE IF EXISTS game;


-- Load extensions

CREATE EXTENSION "uuid-ossp";


-- Create database objects

CREATE TABLE IF NOT EXISTS game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    history JSONB
);

CREATE TABLE IF NOT EXISTS game_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game,
    is_revoked BOOLEAN DEFAULT false,
    token TEXT 
);
