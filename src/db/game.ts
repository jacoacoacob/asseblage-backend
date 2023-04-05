import { pool } from "./pool";

async function dbSelectGame(gameId: string, ) {
    const { rows } = await pool.query("SELECT * FROM game WHERE id = $1");

    return rows;
}


interface RowGame {
    id: string;
    history: any;
}

async function dbCreateGame() {
    const { rows } = await pool.query("INSERT INTO game DEFAULT VALUES RETURNING *");

    return rows[0] as RowGame;
}

interface Event {
    type: string;
    data: unknown;
}


async function dbUpdateGameHistory(gameId: string, events: Event[]) {
    await pool.query(`
        UPDATE game SET history = (
            SELECT history || $1 WHERE id = $2
        )
        WHERE id = $3
    `, [events, gameId, gameId]);  
}

export { dbCreateGame, dbSelectGame, dbUpdateGameHistory };
