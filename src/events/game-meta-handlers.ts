import { dbUpdateGameMetaPhase } from "../db/game-meta";
import { assertAuthenticated } from "../io/assert-authenticated";
import type { IOContext } from "../io/types";
import { resolveAndSend } from "./composed";


function registerGameMetaEventHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("game_meta:set_phase", async (phase) => {
        const { gameId, role } = assertAuthenticated(socket);

        if (role !== "owner") {
            return;
        }

        await dbUpdateGameMetaPhase(gameId, phase);

        await resolveAndSend(context, ["to_all", "game:meta"]);
    });
}


export { registerGameMetaEventHandlers };
