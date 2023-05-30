import { dbUpdateClientDisplayName } from "../db/game-client";
import { assertAuthenticated } from "../io/assert-authenticated";
import { IOContext } from "../io/types";
import * as sessionStore from "../session-store";
import { resolveAndSend } from "./composed";

function registerSessionEventHandlers(context: IOContext) {
    const { socket } = context;

    socket.on("session:set_client_display_name", async (displayName) => {
        const { clientId, gameId } = assertAuthenticated(socket);

        const updatedClient = await dbUpdateClientDisplayName(
            clientId,
            displayName
        );

        if (updatedClient) {
            const { display_name: clientDisplayName } = updatedClient;

            await sessionStore.updateSession({
                clientId,
                gameId,
                clientDisplayName,
            });

            await resolveAndSend(context, ["to_all", "session:all"]);
        }
    });

    socket.on("session:claim_player", (playerId) => {
        const { clientId, gameId } = assertAuthenticated(socket);

        // 1. verify that the playerId has not been claimed by anyone else
        // 2. update the appropriate session's playerIds list to include playerId
    });
}

export { registerSessionEventHandlers };
