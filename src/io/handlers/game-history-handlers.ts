import { dbUpdateGameHistory } from "../../db/game-history";
import { assertAuthenticated } from "../assert-authenticated";
import type { IOContext } from "../types";
import { createSender } from "./composed";

function registerGameHistoryHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("game_history:events", async (events, acknowledge) => {

        const { gameId, clientId } = assertAuthenticated(socket);

        const send = createSender(context);

        try {
            const appendedEvents = await dbUpdateGameHistory(
                gameId,
                events.map(({ playerId, type, data }) => ({
                    type,
                    data,
                    meta: {
                        playerId,
                        clientId,
                        serverTimestamp: Date.now(),
                    },
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

export { registerGameHistoryHandlers };
