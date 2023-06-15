import { dbUpdateGameHistory } from "../../db/game-history";
import { dbUpdateGameMetaPhase } from "../../db/game-meta";
import { assertAuthenticated } from "../assert-authenticated";
import type { IOContext } from "../types";
import { resolveEntity, resolveAndSend } from "./composed";
import { createGameHistoryEvent } from "./game-history-handlers";


function registerGameMetaEventHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("game_meta:start_game", async (_, acknowledge) => {
        const session = assertAuthenticated(socket);

        const { gameId, role } = session;

        if (role !== "owner") {
            return acknowledge({
                success: false,
                message: "Unauthorized!",
            });
        }

        const gamePlayers = await resolveEntity("game:players");

        if (gamePlayers.length < 2) {
            return acknowledge({
                success: false,
                message: "You can't start a game with less than 2 players",
            });
        }

        await dbUpdateGameMetaPhase(gameId, "play");

        const TILES = { rows: 6, cols: 9 };

        await dbUpdateGameHistory(gameId, [
            createGameHistoryEvent({
                type: "start_game:tiles",
                data: [TILES.rows, TILES.cols],
            }),
            createGameHistoryEvent({
                type: "start_game:players",
                data: gamePlayers.map((player) => ({
                    playerId: player.id,
                    tileIndex: Math.floor(
                        Math.random() * TILES.rows * TILES.cols
                    ),
                }))
            }),
        ]);

        await resolveAndSend(context,
            ["to_all", "game:meta"],
            ["to_all", "game_history:events"],
        );

        return acknowledge({ success: true });
    });
}


export { registerGameMetaEventHandlers };
