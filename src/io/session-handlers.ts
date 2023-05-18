import { dbUpdateClientDisplayName } from "../db/game-client";
import { IORoom, IOServerSocket } from "./types";

function registerSessionHandlers(socket: IOServerSocket, gameRoom: IORoom) {
    const { gameId, clientId } = socket.data.session!;

    socket.on("session:set_client_display_name", async (displayName) => {
        const updatedClient = await dbUpdateClientDisplayName(
            clientId,
            displayName
        );

        if (updatedClient) {
            const { display_name: clientDisplayName } = updatedClient;

        }
    });
}

export { registerSessionHandlers };
