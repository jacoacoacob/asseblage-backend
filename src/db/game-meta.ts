import { pool } from "./pool";

interface TRGame {
    id: string;
    display_name: string;
    phase: "setup" | "play" | "complete";
    created: string;
    updated: string;
}

async function dbGetGame(gameId: string) {
    const { rows } = await pool.query("SELECT * FROM game WHERE id = $1", [gameId]);

    return rows[0] as TRGame | undefined;
}

async function dbCreateGame() {
    const { rows } = await pool.query("INSERT INTO game DEFAULT VALUES RETURNING *");

    return rows[0] as TRGame | undefined;
}

async function dbUpdateGameDisplayName(gameId: string, displayName: string) {
    await pool.query(`
        UPDATE game
           SET display_name = $1
         WHERE id = $2
    `, [displayName, gameId]);
    
}

export { dbCreateGame, dbGetGame, dbUpdateGameDisplayName };
export type { TRGame };
