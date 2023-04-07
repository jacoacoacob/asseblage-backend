import type { IOServerSocket, MiddlewareNext } from "./types";
import { type TokenPayload, verifyJwt } from "../utils";

interface AuthPayload {
    gameToken: string;
    sessionToken?: string;
}

function isAuthPayload(data: unknown): data is AuthPayload {
    if (
        typeof data !== "undefined" &&
        Object.prototype.hasOwnProperty.call(data, "gameToken")
    ) {
        const { sessionToken, gameToken } = data as AuthPayload;
        return (
            ["string", "undefined"].includes(typeof gameToken) &&
            ["string", "undefined"].includes(typeof sessionToken)
        )
    }
    return false;
}

function ioSessionMiddleware(socket: IOServerSocket, next: MiddlewareNext) {
    if (isAuthPayload(socket.handshake.auth)) {
        const { sessionToken, gameToken } = socket.handshake.auth;

        if (typeof sessionToken === "undefined") {
            return next(new Error("missing_session_token"));
        }

        if (typeof gameToken === "undefined") {
            return next(new Error("missing_game_token"));
        }
        
        let gameTokenData: TokenPayload;
        let sessionTokenData: TokenPayload;

        try {
            gameTokenData = verifyJwt(gameToken);
        } catch (error) {
            return next(new Error("invalid_game_token"));
        }

        try {
            sessionTokenData = verifyJwt(sessionToken);
        } catch (error) {
            return next(new Error("invalid_session_token"));
        }
        
        if (
            sessionTokenData.game_id !== gameTokenData.game_id ||
            sessionTokenData.role !== gameTokenData.role
        ) {
            return next(new Error("invalid_session_token"));
        }

        const { role, jti, game_id } = sessionTokenData;

        socket.data.session = {
            role,
            gameId: game_id,
            clientId: jti,
        };

        return next();
    }
    return next(new Error("unauthorized"));
}

export { ioSessionMiddleware };
