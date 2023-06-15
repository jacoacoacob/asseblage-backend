import { TCGameHistoryEvent, dbUpdateGameHistory } from "../../db/game-history";
import { assertAuthenticated } from "../assert-authenticated";
import type { IOContext } from "../types";
import { createSender } from "./composed";

interface GameHistoryEvent {
    "start_game:tiles": [number, number];
    "start_game:players": { playerId: string; tileIndex: number }[];
}

interface CreateEvent<Type extends keyof GameHistoryEvent> {
    type: Type;
    data: GameHistoryEvent[Type];
    playerId?: string;
    clientId?: string;
}

function createGameHistoryEvent<Type extends keyof GameHistoryEvent>(options: CreateEvent<Type>): TCGameHistoryEvent<Type> {
    const { type, data, playerId, clientId } = options;
    return {
        type,
        data,
        meta: [
            clientId ?? null,
            playerId ?? null,
            Date.now()
        ],
    }
}

function registerGameHistoryHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("game_history:events", async (events, acknowledge) => {

        const { gameId, clientId } = assertAuthenticated(socket);

        const send = createSender(context);

        try {
            const appendedEvents = await dbUpdateGameHistory(
                gameId,
                events.map(({ type, data, playerId}) => createGameHistoryEvent({
                    type,
                    data,
                    clientId,
                    playerId,
                }))
            );

            send("to_all", "game_history:events:append", appendedEvents);
    
            acknowledge({ success: true });
        } catch (error) {
            console.warn("[game_history:events]", error);
            acknowledge({ success: false });
        }
    });
}

export { registerGameHistoryHandlers, createGameHistoryEvent };
export type { GameHistoryEvent };
