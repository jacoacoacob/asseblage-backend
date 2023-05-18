import { dbUpdateClientDisplayName } from "../db/game-client";
import { IOContext, IOServerSocket } from "../io/types";
import * as sessionStore from "../session-store";
import { resolveAndSend } from "./composed";

function registerSessionEventHandlers(context: IOContext) {
    const { socket } = context;
    const { gameId, clientId } = socket.data.session!;

    socket.on("session:set_client_display_name", async (displayName) => {
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
        console.log("[session:claim_player]", playerId);
    });
}

export { registerSessionEventHandlers };
