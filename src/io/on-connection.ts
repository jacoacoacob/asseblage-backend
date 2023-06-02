
import { makeSessionExpiredHandler } from "../redis-client";
import { registerGameEventHandlers } from "../events/game-event-handlers";
import { createDisconnectHandler } from "./on-disconnect";
import { registerSessionEventHandlers } from "../events/session-event-handlers";
import type { IOContext, IOServer, IOServerSocket } from "./types";
import { registerResolvers, resolveAndSend } from "../events/composed";
import { SESSION_META_KEY_PREFIX, SESSION_PLAYERS_KEY_PREFIX, serializeSessionKeyId } from "../session-store/session-keys";
import { scanKeys } from "../session-store/utils";
import { expireSession } from "../session-store";


function setupPruner(io: IOServer, intervalMillis: number) {
    setInterval(async () => {
        const [sockets, metaKeys, playersKeys] = await Promise.all([
            io.fetchSockets(),
            scanKeys(SESSION_META_KEY_PREFIX + "*"),
            scanKeys(SESSION_PLAYERS_KEY_PREFIX + "*"),
        ])

        const socketSessionKeyIds = sockets.reduce(
            (accum: Set<string>, socket) => {
                const { data: { session } } = socket;
                if (session) {
                    accum.add(serializeSessionKeyId(session));
                }
                return accum;
            },
            new Set<string>()
        );

        const redisSessionKeyIds = [...metaKeys, ...playersKeys].map(
            (key) => key.slice(key.indexOf(":") + 1)
        );

        const expireStaleSessions: Promise<void>[] = [];
        for (let i = 0; i < redisSessionKeyIds.length; i++) {
            const redisKeyId = redisSessionKeyIds[i];
            if (!socketSessionKeyIds.has(redisKeyId)) {
                const [gameId, clientId] = redisKeyId.split("__");
                expireStaleSessions.push(expireSession({ gameId, clientId }));
            }
        }

        await Promise.all(expireStaleSessions);
    }, intervalMillis);
}


function makeConnectionHandler(io: IOServer) {

    setupPruner(io, 5000);

    return async (socket: IOServerSocket) => {        
        const { data: { session } } = socket;
        
        if (!session) {
            throw new Error("unauthenticated");
        }

        const { gameId } = session;

        const context: IOContext = { io, socket, gameRoom: `game:${gameId}` };

        makeSessionExpiredHandler(context);

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
