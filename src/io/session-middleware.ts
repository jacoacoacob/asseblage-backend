import type { IOServer, IOServerSocket, MiddlewareNext } from "./types";
import * as sessionStore from "../session-store";
import { dbCreateGameClient, dbGetGameClient } from "../db/game-client";
import { dbGetGameLink } from "../db/game-link";

interface AuthPayload {
    gameLinkId?: string;
    clientId?: string;
}

function isAuthPayload(data: unknown): data is AuthPayload {
    if (
        typeof data !== "undefined" &&
        Object.prototype.hasOwnProperty.call(data, "gameLinkId")
    ) {
        const { gameLinkId, clientId } = data as AuthPayload;
        return (
            ["string", "undefined"].includes(typeof gameLinkId) &&
            ["string", "undefined"].includes(typeof clientId)
        )
    }
    return false;
}

async function authenticate(socket: IOServerSocket) {
    if (isAuthPayload(socket.handshake.auth)) {
        const { clientId, gameLinkId } = socket.handshake.auth;

        if (typeof gameLinkId === "undefined") {
            throw new Error("ws_unauthorized");
        }

        const gameLink = await dbGetGameLink(gameLinkId);

        if (typeof gameLink === "undefined") {
            throw new Error("ws_unauthorized");
        }

        let gameClient;

        if (typeof clientId === "undefined") {
            gameClient = await dbCreateGameClient(gameLinkId);
            if (typeof gameClient === "undefined") {
                console.error(
                    "Unable to create game_client with game_link_id:",
                    gameLinkId
                );
                throw new Error("ws_unauthorized");
            }
        } else {
            gameClient = await dbGetGameClient(clientId);
            if (typeof gameClient === "undefined") {
                console.error(
                    "Unable to get game_client with clientId:",
                    clientId
                );
                throw new Error("ws_unauthorized");
            }
        }

        if (gameClient.game_link_id !== gameLinkId) {
            console.error(
                "gameClient.game_link_id did not match socket.handshake.auth.gameLinkId"
            );
            throw new Error("ws_unauthorized");
        }

        const { role, game_id: gameId } = gameLink;
        
        return {
            role,
            gameId,
            clientId: gameClient.id,
            clientDisplayName: gameClient.display_name
        };
    }
    throw new Error("ws_unauthorized");
}

function makeIOSessionMiddleware(io: IOServer) {
    return async (socket: IOServerSocket, next: MiddlewareNext) => {
        try {
            const { role, gameId, clientId, clientDisplayName } = await authenticate(socket);
    
            const session = await sessionStore.findSession({ clientId, gameId });
    
            if (session) {
                // Get the IDs of all currently connected sockets so that...
                const allSocketIds = (await io.fetchSockets()).map((socket) => socket.id);

                socket.data.session = await sessionStore.saveSession({
                    ...session,
                    sockets: session.sockets
                        // ...we can remove any closed socket IDs that weren't removed
                        // from redis becuase their sockets closed as a result of an
                        // Express app restart and not one handled by onDisconnect
                        .filter((socketId) => allSocketIds.includes(socketId))
                        // Then, add the current socket ID to redis
                        .concat(socket.id),
                });
            } else {
                socket.data.session = await sessionStore.saveSession({
                    clientId,
                    clientDisplayName,
                    gameId,
                    role,
                    sockets: [socket.id],
                    playerIds: [],
                });
            }
    
        } catch (error) {
            console.error(error);
            return next(new Error("Internal Server Error"));
        }
    
        return next();
    }
}

export { makeIOSessionMiddleware };
