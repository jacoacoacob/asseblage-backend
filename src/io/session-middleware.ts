import type { IOServer, IOServerSocket, MiddlewareNext } from "./types";
import { type TokenPayload, verifyJwt } from "../utils";
import * as sessionStore from "../session-store";

interface AuthPayload {
    gameToken: string;
    clientToken?: string;
}

function isAuthPayload(data: unknown): data is AuthPayload {
    if (
        typeof data !== "undefined" &&
        Object.prototype.hasOwnProperty.call(data, "gameToken")
    ) {
        const { clientToken, gameToken } = data as AuthPayload;
        return (
            ["string", "undefined"].includes(typeof gameToken) &&
            ["string", "undefined"].includes(typeof clientToken)
        )
    }
    return false;
}

function assertAuthenticated(socket: IOServerSocket) {
    if (isAuthPayload(socket.handshake.auth)) {
        const { clientToken, gameToken } = socket.handshake.auth;

        if (typeof clientToken === "undefined") {
            throw new Error("missing_session_token");
        }

        if (typeof gameToken === "undefined") {
            throw new Error("missing_game_token");
        }

        let gameTokenData: TokenPayload;
        let clientTokenData: TokenPayload;

        try {
            gameTokenData = verifyJwt(gameToken);
        } catch (error) {
            throw new Error("invalid_game_token");
        }

        try {
            clientTokenData = verifyJwt(clientToken);
        } catch (error) {
            throw new Error("invalid_session_token");
        }

        if (clientTokenData.game_id !== gameTokenData.game_id) {
            void sessionStore.expireSession({
                gameId: clientTokenData.game_id,
                clientId: clientTokenData.jti,
            });
            throw new Error("invalid_session_token");
        }

        return {
            role: gameTokenData.role!,
            clientId: clientTokenData.jti,
            gameId: clientTokenData.game_id,
        };
    }

    throw new Error("unauthorized");
}

function makeIOSessionMiddleware(io: IOServer) {
    return async (socket: IOServerSocket, next: MiddlewareNext) => {
        try {
            const { role, gameId, clientId } = assertAuthenticated(socket);
    
            const session = await sessionStore.findSession({ clientId, gameId });
    
            if (session) {
                const allSocketIds = (await io.fetchSockets()).map((socket) => socket.id);
                const sockets = session.sockets
                    .filter((socketId) => allSocketIds.includes(socketId))
                    .concat(socket.id);
                socket.data.session = await sessionStore.saveSession({
                    ...session,
                    sockets,
                });
            } else {
                socket.data.session = await sessionStore.saveSession({
                    clientId,
                    gameId,
                    role,
                    sockets: [socket.id],
                    playerIds: [],
                });
            }
    
        } catch (error) {
            return next(error as Error);
        }
    
        return next();
    }
}

export { makeIOSessionMiddleware };
