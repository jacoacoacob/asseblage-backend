import type { DisconnectReason } from "socket.io";

import * as sessionStore from "../session-store";
import type { IOServer, IOServerSocket } from "./types";

function createDisconnectHandler(_: IOServer, socket: IOServerSocket) {
    return async (reason: DisconnectReason) => {
        const { clientId, gameId } = socket.data.session!

        const session = await sessionStore.findSession({ clientId, gameId });
        
        if (session) {
            const indexOfSocketId = session.sockets.indexOf(socket.id);

            session.sockets = session.sockets.filter((_, i) => i !== indexOfSocketId);

            await sessionStore.saveSession(session);

            if (session.sockets.length === 0) {
                await sessionStore.expireSession({ clientId, gameId });
            }
        }

        socket.data.session = session!;
    }
}

export { createDisconnectHandler };
