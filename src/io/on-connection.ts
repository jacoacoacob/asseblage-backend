import { makeSessionExpiredHandler } from "../redis-client";
import * as sessionStore from "../session-store";
import { createDisconnectHandler } from "./on-disconnect";
import type { IOServer, IOServerSocket } from "./types";

function makeConnectionHandler(io: IOServer) {

    makeSessionExpiredHandler(io);

    return async (socket: IOServerSocket) => {
        const { clientId, gameId } = socket.data.session!;

        // join game room
        socket.join(`game:${gameId}`);
    
        // fetch game state from database
        const gameState = {};
    
        // find all game players
        const sessions = await sessionStore.listActiveSessionsForGame(gameId);

        socket.emit("session", sessionStore.mapClientSession(socket.data.session!));
        
        io.to(`game:${gameId}`).emit("connected_clients", sessions.map(sessionStore.mapClientSession));
    
        socket.on("disconnect", createDisconnectHandler(io, socket));
    }
}

export { makeConnectionHandler };
