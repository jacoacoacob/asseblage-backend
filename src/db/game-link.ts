import { pool } from "./pool";
import { DbResult } from "./types";

interface TRGameLink {
    id: string;
    game_id: string;
    role: "guest" | "owner";
}

async function dbCreateGameLink(gameId: string, role: TRGameLink["role"]) {
    const { rows } = await pool.query(
        `INSERT INTO game_link (
                        game_id,
                        role
                     )
              VALUES ($1, $2)
           RETURNING *`,
        [gameId, role]
    );

    return rows[0] as DbResult<TRGameLink>;
}

async function dbGetGameLink(id: string) {
    const { rows } = await pool.query(`SELECT * FROM game_link WHERE id = $1`, [id]);

    return rows[0] as DbResult<TRGameLink>;
}

export { dbCreateGameLink, dbGetGameLink };
