
import { makeSessionExpiredHandler } from "../redis-client";
import { registerGameEventHandlers } from "../events/game-event-handlers";
import { createDisconnectHandler } from "./on-disconnect";
import { registerSessionEventHandlers } from "../events/session-event-handlers";
import type { IOContext, IOServer, IOServerSocket } from "./types";
import { registerResolvers, resolveAndSend } from "../events/composed";

function makeConnectionHandler(io: IOServer) {

    makeSessionExpiredHandler(io);

    return async (socket: IOServerSocket) => {        
        const { data: { session } } = socket;
        
        if (!session) {
            throw new Error("unauthenticated");
        }

        const { gameId } = session;

        const context: IOContext = { io, socket, gameRoom: `game:${gameId}` };

        socket.join(context.gameRoom);

        registerResolvers(context);

        resolveAndSend(
            context,
            ["to_sender", "game:meta"],
            ["to_sender", "game:history"],
            ["to_sender", "game:links"],
            ["to_sender", "game:players"],
            ["to_sender", "session:client_id"],
            ["to_all", "session:all"]
        )

        registerSessionEventHandlers(context);
        registerGameEventHandlers(context);

        socket.on("disconnect", createDisconnectHandler(io, socket));
    }
}

export { makeConnectionHandler };
