import { dbUpdateClientDisplayName } from "../db/game-client";
import { IOContext, IOServerSocket } from "../io/types";
import * as sessionStore from "../session-store";

function registerSessionEventHandlers(context: IOContext) {
    const { io, socket, gameRoom } = context;
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

            io.in(gameRoom).emit(
                "session:all",
                await sessionStore.listActiveClientSessionsForGame(gameId)
            );
        }
    });

    socket.on("session:claim_player", (playerId) => {
        console.log("[session:claim_player]", playerId);
    });
}

export { registerSessionEventHandlers };
