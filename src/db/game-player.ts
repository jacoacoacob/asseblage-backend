import { pool } from "./pool";

interface TRGamePlayer {
    id: string;
    game_id: string;
    display_name: string;
}

async function dbListGamePlayers(gameId: string) {
    const { rows } = await pool.query(
        "SELECT * FROM game_player WHERE game_id = $1", [gameId]
    );

    return rows as TRGamePlayer[];
}

async function dbCreateGamePlayer(gameId: string, displayName: string) {
    const { rows } = await pool.query(
        `INSERT INTO game_player (game_id, display_name)
              VALUES ($1, $2)
           RETURNING *`,
        [gameId, displayName]
    );

    return rows[0] as TRGamePlayer;
}

async function dbUpdateGamePlayerDisplayName(playerId: string, displayName: string) {
    const { rows } = await pool.query(`
           UPDATE game_player
              SET display_name = $1
            WHERE id = $2
        RETURNING *`,
        [displayName, playerId]
    );

    return rows[0] as TRGamePlayer | undefined;
}

export { dbCreateGamePlayer, dbUpdateGamePlayerDisplayName, dbListGamePlayers };
export { TRGamePlayer };
