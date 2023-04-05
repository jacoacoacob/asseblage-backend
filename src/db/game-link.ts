import { pool } from "./pool";

interface RowGameLink {
    id: string;
    game_id: string;
    is_revoked: string;
    token: string;
}

async function dbCreateGameLink(gameId: string, token: string) {
    const { rows } = await pool.query(
        "INSERT INTO game_link (game_id, token) VALUES ($1, $2) RETURNING *",
        [gameId, token]
    );

    return rows[0] as RowGameLink;
}

export { dbCreateGameLink };
