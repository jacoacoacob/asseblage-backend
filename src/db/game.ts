import { pool } from "./pool";

type TCGameHistory = Array<{ type: string; data: unknown }>;

interface TRGame {
    id: string;
    history: TCGameHistory;
}

async function dbSelectGame(gameId: string) {
    const { rows } = await pool.query("SELECT * FROM game WHERE id = $1", [gameId]);

    return rows[0] as TRGame;
}

async function dbCreateGame() {
    const { rows } = await pool.query("INSERT INTO game DEFAULT VALUES RETURNING *");

    return rows[0] as TRGame;
}

async function dbUpdateGameHistory(gameId: string, events: TCGameHistory[]) {
    await pool.query(`
        UPDATE game SET history = (
            SELECT history || $1 WHERE id = $2
        )
        WHERE id = $3
    `, [events, gameId, gameId]);  
}

export { dbCreateGame, dbSelectGame, dbUpdateGameHistory };
