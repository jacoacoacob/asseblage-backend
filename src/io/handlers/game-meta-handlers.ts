import { dbUpdateGameMetaPhase } from "../../db/game-meta";
import { assertAuthenticated } from "../assert-authenticated";
import type { IOContext } from "../types";
import { resolveEntity, resolveAndSend } from "./composed";


function registerGameMetaEventHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("game_meta:start_game", async (_, acknowledge) => {
        const { gameId, role } = assertAuthenticated(socket);

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

        await resolveAndSend(context, ["to_all", "game:meta"]);

        return acknowledge({ success: true });
    });
}


export { registerGameMetaEventHandlers };
