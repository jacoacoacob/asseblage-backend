import { pool } from "./pool";

interface TCGameHistoryEvent {
    type: string;
    data: unknown;
}

interface TRGameHistory {
    game_id: string;
    events: TCGameHistoryEvent[];
    updated: string;
}

async function dbCreateGameHistory(gameId: string) {
    const { rows } = await pool.query(`
        INSERT INTO game_history (game_id, events)
             VALUES ($1, $2)
          RETURNING *
    `, [gameId, []]);

    return rows[0] as TRGameHistory | undefined;
}

async function dbGetGameHistory(gameId: string) {
    const { rows } = await pool.query(`
        SELECT *
          FROM game_history
         WHERE game_id = $1
        `, [gameId]
    );

    return rows[0] as TRGameHistory | undefined;
}

async function dbGetGameHistoryUpdated(gameId: string) {
    const { rows } = await pool.query(`
        SELECT updated
          FROM game_history
         WHERE game_id = $1
    `, [gameId]);

    return rows[0] as string | undefined;
}

async function dbUpdateGameHistory(gameId: string, events: TCGameHistoryEvent[]) {
    await pool.query(`
        UPDATE game_history
           SET events = (SELECT events || $1 FROM game_history WHERE game_id = $2)
         WHERE game_id = $2
    `, [events, gameId]);  
}

export { dbCreateGameHistory, dbGetGameHistory, dbGetGameHistoryUpdated, dbUpdateGameHistory };
export type { TRGameHistory, TCGameHistoryEvent };
