-- Clean up existing database objects

DROP TABLE IF EXISTS game_player;
DROP TABLE IF EXISTS game_client;
DROP TABLE IF EXISTS game_link;
DROP TABLE IF EXISTS game_history;
DROP TABLE IF EXISTS game;


-- Load extensions

CREATE EXTENSION "uuid-ossp";


-- Create database objects

CREATE TABLE IF NOT EXISTS game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT DEFAULT '',
    phase TEXT DEFAULT 'setup',
    created TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- This represents a someone participating in a game.
-- One client can support multiple players.
CREATE TABLE IF NOT EXISTS game_player (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game,
    display_name TEXT NOT NULL,
    UNIQUE(game_id, display_name)
);

CREATE TABLE IF NOT EXISTS game_history (
    game_id UUID REFERENCES game,
    events JSONB[]
);

CREATE TABLE IF NOT EXISTS game_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game,
    role TEXT NOT NULL,
    created TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- This represents a web browser that has opened a game page
-- with a given link
CREATE TABLE IF NOT EXISTS game_client (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_link_id UUID REFERENCES game_link,
    display_name TEXT DEFAULT '',
    created TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    last_connected TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);
