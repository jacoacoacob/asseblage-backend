import type { DisconnectReason } from "socket.io";

import { getSession, updateSessionMeta, expireSession } from "../session-store";
import type { IOServer, IOServerSocket } from "./types";

function createDisconnectHandler(_: IOServer, socket: IOServerSocket) {
    return async (reason: DisconnectReason) => {
        const { clientId, gameId } = socket.data.session!

        const session = await getSession({ clientId, gameId });
        
        if (session) {
            const indexOfSocketId = session.sockets.indexOf(socket.id);

            session.sockets = session.sockets.filter((_, i) => i !== indexOfSocketId);

            await updateSessionMeta(session);

            socket.data.session = session;

            if (session.sockets.length === 0) {
                await expireSession({ clientId, gameId });
            }
        }

    }
}

export { createDisconnectHandler };
