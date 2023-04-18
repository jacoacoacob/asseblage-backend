import { pool } from "./pool";

interface RowGamePlayer {
    id: string;
    game_id: string;
    name: string;
}

async function createGamePlayer(gameId: string, playerName: string) {
    const { rows } = await pool.query(
        "INSERT INTO game_player (game_id, name) VALUES ($1, $2) RETURNING *",
        [gameId, playerName]
    );

    return rows[0] as RowGamePlayer;
}

async function updateGamePlayerName(playerId: string, playerName: string) {
    const { rows } = await pool.query(
        "UPDATE game_player SET name = $1 WHERE id = $2 RETURNING *",
        [playerName, playerId]
    );

    return rows[0] as RowGamePlayer | undefined;
}

export { createGamePlayer, updateGamePlayerName };
