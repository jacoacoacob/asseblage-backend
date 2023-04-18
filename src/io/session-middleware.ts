import type { IOServerSocket, MiddlewareNext } from "./types";
import { type TokenPayload, verifyJwt } from "../utils";
import { expireSession } from "../session-store";

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

async function ioSessionMiddleware(socket: IOServerSocket, next: MiddlewareNext) {
    if (isAuthPayload(socket.handshake.auth)) {
        const { clientToken, gameToken } = socket.handshake.auth;

        if (typeof clientToken === "undefined") {
            return next(new Error("missing_session_token"));
        }

        if (typeof gameToken === "undefined") {
            return next(new Error("missing_game_token"));
        }
        
        let gameTokenData: TokenPayload;
        let clientTokenData: TokenPayload;

        try {
            gameTokenData = verifyJwt(gameToken);
        } catch (error) {
            return next(new Error("invalid_game_token"));
        }

        try {
            clientTokenData = verifyJwt(clientToken);
        } catch (error) {
            return next(new Error("invalid_session_token"));
        }
        
        if (clientTokenData.game_id !== gameTokenData.game_id) {
            void expireSession({
                gameId: clientTokenData.game_id,
                clientId: clientTokenData.jti,
            });
            return next(new Error("invalid_session_token"));
        }

        const { role } = gameTokenData;
        const { jti, game_id } = clientTokenData;

        socket.data.session = {
            role: role!,
            gameId: game_id,
            clientId: jti,
        };

        return next();
    }
    return next(new Error("unauthorized"));
}

export { ioSessionMiddleware };
