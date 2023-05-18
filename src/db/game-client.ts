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

async function dbGetGameClient(clientId: string) {
    const { rows } = await pool.query(
        "SELECT * FROM game_client WHERE id = $1",
        [clientId]
    );

    return rows[0] as TRGameClient | undefined;
}

async function dbUpdateClientDisplayName(clientId: string, displayName: string) {
    const sql = `
           UPDATE game_client
              SET display_name = $1
            WHERE id = $2
        RETURNING *
    `;

    const { rows } = await pool.query(sql, [displayName, clientId]);

    return rows[0] as TRGameClient | undefined;
}


export { dbCreateGameClient, dbGetGameClient, dbUpdateClientDisplayName };
