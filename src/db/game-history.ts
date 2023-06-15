import { GameHistoryEvent } from "../io/handlers/game-history-handlers";
import { pool } from "./pool";

type PlayerId = string;
type ClientId = string;
type ServerTimestamp = number;

interface TCGameHistoryEvent<Type extends keyof GameHistoryEvent> {
    type: Type;
    data: GameHistoryEvent[Type];
    meta: [
        ClientId | null,
        PlayerId | null,
        ServerTimestamp
    ];
}

interface TRGameHistory {
    game_id: string;
    events: TCGameHistoryEvent<keyof GameHistoryEvent>[];
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

    if (rows[0]) {
        return rows[0].updated as string;
    }
}

async function dbUpdateGameHistory(
    gameId: string,
    events: TCGameHistoryEvent<keyof GameHistoryEvent>[]
) {
    await pool.query(`
        UPDATE game_history
           SET events = events || $1
         WHERE game_id = $2
    `, [events, gameId]);

    return events;
}

export { dbCreateGameHistory, dbGetGameHistory, dbGetGameHistoryUpdated, dbUpdateGameHistory };
export type { TRGameHistory, TCGameHistoryEvent };
