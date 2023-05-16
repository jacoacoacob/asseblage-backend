import { pool } from "./pool";

type TCGameHistoryEvents = Array<{ type: string; data: unknown }>;

interface TRGameHistory {
    game_id: string;
    events: TCGameHistoryEvents;
}

async function dbCreateGameHistory(gameId: string) {
    const { rows } = await pool.query(`
        INSERT INTO game_history (game_id, events)
             VALUES ($1, $2)
          RETURNING *
    `, [gameId, []]);

    return rows[0] as TRGameHistory | undefined;
}

async function dbListGameHistoryEvents(gameId: string) {
    const { rows } = await pool.query(
        "SELECT * FROM game_history WHERE game_id = $1",
        [gameId]
    );

    return (rows[0] as TRGameHistory).events ?? [];
}

async function dbUpdateGameHistory(gameId: string, events: TCGameHistoryEvents[]) {
    await pool.query(`
        UPDATE game_history
           SET events = (SELECT events || $1 FROM game_history WHERE game_id = $2)
         WHERE game_id = $2
    `, [events, gameId]);  
}

export { dbCreateGameHistory, dbListGameHistoryEvents, dbUpdateGameHistory };
export type { TRGameHistory };
