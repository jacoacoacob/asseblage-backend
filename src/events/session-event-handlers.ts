import { dbUpdateClientDisplayName } from "../db/game-client";
import { assertAuthenticated } from "../io/assert-authenticated";
import { IOContext } from "../io/types";
import { updateSessionMeta, addSessionPlayer, removeSessionPlayers } from "../session-store";
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

            await updateSessionMeta({
                clientId,
                gameId,
                clientDisplayName,
            });

            await resolveAndSend(context, ["to_all", "session:all"]);
        }
    });

    socket.on("session:claim_player", async ({ playerId }) => {
        const { clientId, gameId } = assertAuthenticated(socket);

        await addSessionPlayer({ clientId, gameId, playerId });

        await resolveAndSend(context, ["to_all", "session:all"]);
    });

    socket.on("session:unclaim_player", async ({ playerId }) => {
        const { clientId, gameId } = assertAuthenticated(socket);

        await removeSessionPlayers({
            clientId,
            gameId,
            playerIds: [playerId]
        });

        await resolveAndSend(context, ["to_all", "session:all"]);
    });
}

export { registerSessionEventHandlers };
