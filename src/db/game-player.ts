import { pool } from "./pool";

interface TRGamePlayer {
    id: string;
    game_id: string;
    /** the clientId of the client that created this player */
    created_by: string;
    display_name: string;
    created: string;
    updated: string;
}

async function dbListGamePlayers(gameId: string) {
    const sql = `
        SELECT *
          FROM game_player
         WHERE game_id = $1
      ORDER BY created
          DESC
    `;

    const { rows } = await pool.query(sql, [gameId]);

    return rows as TRGamePlayer[];
}

async function dbCreateGamePlayer(gameId: string, clientId: string, displayName: string) {
    const { rows } = await pool.query(
        `INSERT INTO game_player (game_id, created_by, display_name)
              VALUES ($1, $2, $3)
           RETURNING *`,
        [gameId, clientId, displayName]
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

async function dbDeleteGamePlayer(playerId: string) {
    await pool.query("DELETE FROM game_player WHERE id = $1", [playerId]);
}

export { dbCreateGamePlayer, dbUpdateGamePlayerDisplayName, dbListGamePlayers, dbDeleteGamePlayer };
export { TRGamePlayer };
