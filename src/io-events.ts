import { Payload, verifyJwt } from "./utils";
import { IO } from "./io-server";
import { JsonWebTokenError } from "jsonwebtoken";


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

function setupIO(io: IO) {

    io.use((socket, next) => {
        if (isAuthPayload(socket.handshake.auth)) {
            const { clientToken, gameToken } = socket.handshake.auth;

            if (typeof clientToken === "undefined") {
                return next(new Error("no_client_token"));
            }

            if (typeof gameToken === "undefined") {
                return next(new Error("no_game_token"));
            }
            
            let gameTokenData: Payload;
            let clientTokenData: Payload;

            try {
                gameTokenData = verifyJwt(gameToken);
            } catch (error) {
                return next(new Error("invalid_game_token"));
            }

            try {
                clientTokenData = verifyJwt(clientToken);
            } catch (error) {
                return next(new Error("invalid_client_token"));
            }
            if (
                clientTokenData.game_id !== gameTokenData.game_id ||
                clientTokenData.role !== gameTokenData.role
            ) {
                return next(new Error("invalid_client_token"));
            }

            const { role, jti } = clientTokenData;
            socket.data.user = { role, clientId: jti };
            
            return next();
        }
        return next(new Error("bad_credentials"));
    })

    io.on("connection", (socket) => {
        console.log("[nsBase] onConnection", socket.data.user);

    });
}

export { setupIO };
