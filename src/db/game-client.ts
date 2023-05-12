import { pool } from "./pool";

interface TRGameClient {
    id: string;
    game_link_id: string;
    display_name: string;
}

async function dbCreateGameClient(gameLinkId: string) {
    const sql = `
        INSERT INTO game_client (game_link_id)
             VALUES ($1)
          RETURNING *
    `;
    const { rows } = await pool.query(sql, [gameLinkId]);

    return rows[0] as TRGameClient | undefined;
}

async function dbGetGameClient(id: string) {
    const { rows } = await pool.query(
        "SELECT * FROM game_client WHERE id = $1",
        [id]
    );

    return rows[0] as TRGameClient | undefined;
}


export { dbCreateGameClient, dbGetGameClient };
