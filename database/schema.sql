-- Clean up existing database objects

DROP TRIGGER IF EXISTS on_game_player_updated ON game_player;
DROP TRIGGER IF EXISTS on_game_updated ON game;

DROP FUNCTION IF EXISTS row_updated;

DROP TABLE IF EXISTS game_player;
DROP TABLE IF EXISTS game_client;
DROP TABLE IF EXISTS game_link;
DROP TABLE IF EXISTS game_history;
DROP TABLE IF EXISTS game;


-- Load extensions

CREATE EXTENSION "uuid-ossp";


-- Create tables

CREATE TABLE IF NOT EXISTS game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT DEFAULT '',
    phase TEXT DEFAULT 'setup',
    created TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
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

-- This represents a someone participating in a game.
-- One client can support multiple players.
CREATE TABLE IF NOT EXISTS game_player (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game,
    created_by UUID REFERENCES game_client,
    display_name TEXT NOT NULL,
    created TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(game_id, display_name)
);


-- Create triggers and trigger functions

CREATE OR REPLACE FUNCTION row_updated()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
    BEGIN
        NEW.updated := (NOW() AT TIME ZONE 'UTC');
        RETURN NEW;
    END;
$$;

CREATE OR REPLACE TRIGGER on_game_player_updated
BEFORE INSERT OR UPDATE ON game_player
FOR EACH ROW EXECUTE FUNCTION row_updated();

CREATE OR REPLACE TRIGGER on_game_updated
BEFORE INSERT OR UPDATE ON game
FOR EACH ROW EXECUTE FUNCTION row_updated();
